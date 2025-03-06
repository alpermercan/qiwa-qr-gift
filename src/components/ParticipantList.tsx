'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Campaign {
  id: string;
  name: string;
  discount_rate: number;
}

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
}

interface CampaignParticipation {
  participant: Participant;
  campaign: Campaign;
  id: string;
  is_used: boolean;
  used_at: string | null;
}

interface FormattedParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  campaign_name: string;
  discount_rate: number;
  is_used: boolean;
  used_at: string | null;
  participation_id: string;
}

type SortOrder = 'asc' | 'desc';

export default function ParticipantList() {
  const [participants, setParticipants] = useState<FormattedParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  useEffect(() => {
    fetchCampaigns();
    fetchParticipants();

    // Realtime subscription
    const channel = supabase
      .channel('participant_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_participants'
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortOrder, selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      toast.error('Kampanyalar yüklenirken bir hata oluştu');
    }
  };

  const fetchParticipants = async () => {
    try {
      console.log('Fetching participants...');
      let query = supabase
        .from('campaign_participations')
        .select(`
          participant:campaign_participants!inner (
            id,
            first_name,
            last_name,
            email,
            phone,
            created_at
          ),
          id,
          campaign:campaigns!inner (
            id,
            name,
            discount_rate
          ),
          is_used,
          used_at
        `)
        .order('participant(created_at)', { ascending: sortOrder === 'asc' });

      if (selectedCampaign) {
        query = query.eq('campaign.id', selectedCampaign);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching participants:', error);
        throw error;
      }

      console.log('Raw data:', data);

      // Verileri düzenle
      const formattedParticipants = (data as unknown as Array<{
        participant: Participant;
        campaign: Campaign;
        id: string;
        is_used: boolean;
        used_at: string | null;
      }>)?.map(participation => ({
        id: participation.participant.id,
        first_name: participation.participant.first_name,
        last_name: participation.participant.last_name,
        email: participation.participant.email,
        phone: participation.participant.phone,
        created_at: participation.participant.created_at,
        campaign_name: participation.campaign.name,
        discount_rate: participation.campaign.discount_rate,
        is_used: participation.is_used,
        used_at: participation.used_at,
        participation_id: participation.id
      }));

      console.log('Formatted participants:', formattedParticipants);
      setParticipants(formattedParticipants || []);
    } catch (err) {
      console.error('Error in fetchParticipants:', err);
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
      setError(`Katılımcılar yüklenirken bir hata oluştu: ${errorMessage}`);
      toast.error('Katılımcılar yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseParticipation = async (participant: FormattedParticipant) => {
    if (!participant.participation_id || processingIds.has(participant.id)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(participant.id));

      const { data, error } = await supabase
        .rpc('use_campaign_participation', {
          participation_id: participant.participation_id
        });

      if (error) {
        console.error('Error using participation:', error);
        toast.error('Kupon kullanımı sırasında bir hata oluştu');
        return;
      }

      if (data === false) {
        toast.error('Bu kupon daha önce kullanılmış');
        return;
      }

      toast.success('Kupon başarıyla kullanıldı');
      await fetchParticipants(); // Tabloyu yenile
    } catch (err) {
      console.error('Error in handleUseParticipation:', err);
      toast.error('Kupon kullanımı sırasında bir hata oluştu');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(participant.id);
        return next;
      });
    }
  };

  const handleRevertParticipation = async (participant: FormattedParticipant) => {
    if (!participant.participation_id || processingIds.has(participant.id)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(participant.id));

      const { data, error } = await supabase
        .rpc('revert_campaign_participation', {
          participation_id: participant.participation_id
        });

      if (error) {
        console.error('Error reverting participation:', error);
        toast.error('Kupon kullanımı geri alınırken bir hata oluştu');
        return;
      }

      toast.success('Kupon kullanımı başarıyla geri alındı');
      await fetchParticipants(); // Tabloyu yenile
    } catch (err) {
      console.error('Error in handleRevertParticipation:', err);
      toast.error('Kupon kullanımı geri alınırken bir hata oluştu');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(participant.id);
        return next;
      });
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };

  const filteredParticipants = useMemo(() => {
    if (!searchTerm) return participants;

    const searchTermLower = searchTerm.toLowerCase().trim();
    return participants.filter(participant => 
      `${participant.first_name} ${participant.last_name}`.toLowerCase().includes(searchTermLower) ||
      participant.email.toLowerCase().includes(searchTermLower) ||
      participant.phone.toLowerCase().includes(searchTermLower)
    );
  }, [participants, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin inline-block w-6 h-6 border-[3px] border-current border-t-transparent text-blue-600 rounded-full dark:text-blue-500" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-800/10 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400 dark:text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-600">{error}</h3>
          </div>
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center py-10">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Katılımcı Bulunamadı</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Henüz hiç katılımcı bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Katılımcılar</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="İsim, e-posta veya telefon ara..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-white"
          >
            <option value="">Tüm Kampanyalar</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <button
            onClick={toggleSortOrder}
            className="inline-flex items-center gap-x-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
          >
            <span>Kayıt Tarihi</span>
            {sortOrder === 'asc' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="-m-1.5 overflow-x-auto">
          <div className="p-1.5 min-w-full inline-block align-middle">
            <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-slate-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Ad Soyad</th>
                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">İletişim</th>
                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Kampanya</th>
                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">İndirim</th>
                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Durum</th>
                    <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
                      <div className="flex items-center gap-x-2">
                        <span>Kayıt Tarihi</span>
                        <button onClick={toggleSortOrder} className="text-gray-500 dark:text-gray-400">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredParticipants.map((participant) => (
                    <tr key={participant.id} className="bg-white hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {participant.first_name} {participant.last_name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">{participant.email}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{participant.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className={`text-sm ${participant.campaign_name !== '-' ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400 italic'}`}>
                          {participant.campaign_name}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {participant.discount_rate > 0 ? (
                          <span className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-500">
                            %{participant.discount_rate}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {participant.campaign_name !== '-' && (
                          participant.is_used ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <span className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400">
                                  Kullanıldı
                                </span>
                                {participant.used_at && (
                                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {format(new Date(participant.used_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRevertParticipation(participant)}
                                disabled={processingIds.has(participant.id)}
                                className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800/30 dark:text-red-500 dark:hover:bg-red-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingIds.has(participant.id) ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    İşleniyor
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                    Geri Al
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-500">
                                Kullanılabilir
                              </span>
                              <button
                                onClick={() => handleUseParticipation(participant)}
                                disabled={processingIds.has(participant.id)}
                                className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800/30 dark:text-blue-500 dark:hover:bg-blue-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingIds.has(participant.id) ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    İşleniyor
                                  </>
                                ) : (
                                  <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Kullan
                                  </>
                                )}
                              </button>
                            </div>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                        {format(new Date(participant.created_at), 'dd MMMM yyyy HH:mm', { locale: tr })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredParticipants.length === 0 && searchTerm && (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">Sonuç Bulunamadı</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Arama kriterlerinize uygun katılımcı bulunamadı.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 