"use client";


import YouTubePlayer from "@/components/YouTubePlayer";
import LeftNav from "@/components/LeftNav";

export default function Home({
  searchParams,
}: {
  searchParams?: {
    videoId?: string;
    page?: string;
  };
}){

  const videoId = searchParams?.videoId || 'OWut8sCNFP8';

  return (
  <div className="flex flex-row">
  <LeftNav/>
  <YouTubePlayer videoId={videoId} />
  </div>
  );
}
