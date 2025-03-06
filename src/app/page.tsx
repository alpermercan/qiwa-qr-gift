import { redirect } from 'next/navigation';
import { brandConfig } from '@/config/brand';
import Image from "next/image";

export default function Home() {
  redirect(brandConfig.social.instagram.url);
}
