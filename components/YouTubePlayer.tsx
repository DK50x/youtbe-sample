'use client';

import React, { useState, useEffect, useRef } from 'react';
import { IoMdPlay,IoMdPause } from "react-icons/io";

interface YouTubePlayerProps {
  videoId: string;
}

interface YT {
  Player: new (
    elementId: string,
    options: {
      height?: string;
      width?: string;
      videoId: string;
      events: {
        onReady: (event: { target: YTPlayer }) => void;
        onStateChange: (event: { data: number }) => void;
      };
    }
  ) => YTPlayer;
  PlayerState: {
    PLAYING: number;
    PAUSED: number;
    ENDED: number;
  };
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadVideoById: (videoId:string) => void;
  stopVideo: () => void;
}

declare global {
  interface Window {
    YT: YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(100);


  const videoRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const trimEndRef = useRef<number>(100);
  const trimStartRef = useRef<number>(0);
  const durationRef = useRef<number>(0)


  useEffect(() => {
    //code based off https://developers.google.com/youtube/iframe_api_reference
    if(!window.YT){
      console.log("loading player for first time")
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      //when the youtube api is ready load the video
      window.onYouTubeIframeAPIReady = loadVideo;

      //save the trime to local storage based off the video ID
      const savedTrimStart = localStorage.getItem(`trimStart-${videoId}`);
      const savedTrimEnd = localStorage.getItem(`trimEnd-${videoId}`);
      if (savedTrimStart) trimStartRef.current = parseFloat(savedTrimStart)
      if (savedTrimEnd) trimEndRef.current = parseFloat(savedTrimEnd)

    } else{
      console.log("player already loaded")
      playerRef.current.loadVideoById(videoId);
      playerRef.current?.stopVideo()
      setCurrentTime(0);
      console.log("useEffect dur "+ playerRef.current?.getDuration())


      loadTrim()
    }

    return () => {
      window.onYouTubeIframeAPIReady = () => {};
    };
  }, [videoId]);

    useEffect(() => {
        trimStartRef.current = trimStart;
        trimEndRef.current = trimEnd;
    }, [trimStart, trimEnd]);

  const loadTrim = () =>{
      const savedTrimStart = localStorage.getItem(`trimStart-${videoId}`);
      const savedTrimEnd = localStorage.getItem(`trimEnd-${videoId}`);
      if (savedTrimStart){
        trimStartRef.current = parseFloat(savedTrimStart)
        setTrimStart(parseFloat(savedTrimStart))
      } else{
        trimStartRef.current = 0
        setTrimStart(0)
      }
      if (savedTrimEnd){
        trimEndRef.current = parseFloat(savedTrimEnd)
        setTrimEnd(parseFloat(savedTrimEnd))
      } else {
        trimEndRef.current = 100
        setTrimEnd(100)
      }
  }

  const loadVideo = async () => {
    if (!videoRef.current) return;
    console.log("Player ready")

    //based off https://developers.google.com/youtube/iframe_api_reference
    playerRef.current = new window.YT.Player('youtube-player', {
      height: '315',
      width: '560',
      videoId: videoId,
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });

  };

  //get the duration of the video from the api once the player is ready
  const onPlayerReady = (event: { target: YTPlayer }) => {
    durationRef.current = event.target.getDuration();
  };


  const onPlayerStateChange = (event: { data: number }) => {

    //check if the youtube video is playing
    if (event.data === -1){
      setCurrentTime(0)
    }
    if (event.data === window.YT.PlayerState.PLAYING) {
      //update the state
      setIsPlaying(true);
      startProgressUpdate();
    } else {
      setIsPlaying(false);
      stopProgressUpdate();
    }

    if (event.data === window.YT.PlayerState.ENDED) {
      playerRef.current?.seekTo(trimStartRef.current / 100 * durationRef.current);
      playerRef.current?.pauseVideo();
    }
  };

  //Time update function to stop when the video gets to the end of the trim
  const startProgressUpdate = () => {
    
    const update = () => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        setCurrentTime(time);
        if(time <= (trimStartRef.current/100) * durationRef.current )
          playerRef.current.seekTo(trimStartRef.current / 100 * durationRef.current);
        if(time >= (trimEndRef.current / 100) * durationRef.current) {
          console.log(`prog pause, trimEnd ${trimEndRef.current}, duration ${durationRef.current}`)
          playerRef.current.pauseVideo();
          playerRef.current.seekTo(trimStartRef.current / 100 * durationRef.current);
        }
      }
      animationFrameId.current = requestAnimationFrame(update);
    };
    animationFrameId.current = requestAnimationFrame(update);
  };

  const stopProgressUpdate = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  };


  const togglePlayPause = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {

    if (!progressBarRef.current || !playerRef.current) return;

    console.log("current time on click: "+currentTime)

    const progressBar = progressBarRef.current;
    const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    const newTime = Math.max(trimStartRef.current / 100 * durationRef.current, 
        Math.min(trimEndRef.current / 100 * durationRef.current, clickPosition * durationRef.current));
    playerRef.current.seekTo(newTime);
    setCurrentTime(newTime);
  };

  const handleTrimDragStart = (e: React.MouseEvent<HTMLDivElement>, isStart: boolean) => {
    

    const handleMouseMove = (event: MouseEvent) => {
      event.preventDefault(); // Prevent text selection during drag
      handleTrimDrag(event as unknown as React.MouseEvent<HTMLDivElement>, isStart);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTrimDrag = (e: React.MouseEvent<HTMLDivElement>, isStart: boolean) => {
    if (!progressBarRef.current) return;

    const progressBar = progressBarRef.current;
    const dragPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
    const newValue = Math.max(0, Math.min(100, dragPosition * 100));

    if (isStart) {
      const newTrimStart = Math.min(newValue, trimEnd - 1);
      setTrimStart(newTrimStart);
      trimStartRef.current = newTrimStart;
      localStorage.setItem(`trimStart-${videoId}`, newTrimStart.toString());
      
      // Only seek if the current time is before the new trim start
      if (playerRef.current && currentTime < (newTrimStart / 100) * durationRef.current) {
        playerRef.current.seekTo((newTrimStart / 100) * durationRef.current);
        setCurrentTime((newTrimStart / 100) * durationRef.current);
      }
    } else {
      const newTrimEnd = Math.max(newValue, trimStart + 1);
      setTrimEnd(newTrimEnd);
      trimEndRef.current = newTrimEnd;
      localStorage.setItem(`trimEnd-${videoId}`, newTrimEnd.toString());
      
      // Don't seek when adjusting the end trim
      // Instead, pause the video if it's playing and the current time is past the new trim end
      if (playerRef.current && currentTime > (newTrimEnd / 100) * durationRef.current) {
        if (isPlaying) {
          console.log("trim pause")
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        }
      }
    }
  };

  return (
    <div className="flex flex-col flex-grow bg-gray-900 items-center jusitfy-center h-screen ">
      <div className="flex flex-col w-440 mt-10">
      <div id="youtube-player" ref={videoRef}/>
      <div className="flex flex-row mt-2.5 items-end">
        { isPlaying ? 
         <IoMdPause className='mr-2.5' onClick={togglePlayPause} /> : 
         <IoMdPlay color="white" className='mr-2.5' onClick={togglePlayPause} />
        }
        <div className="relative h-3 w-full rounded-full bg-gray-300 mt-2 cursor-pointer" ref={progressBarRef} onClick={handleProgressBarClick}>
          <div className="absolute rounded-full h-full bg-red-500" style={{ width: `${(currentTime / durationRef.current) * 100}%` }}/>
          {/*<div className="trim-area" style={{ left: `${trimStart}%`, width: `${trimEnd - trimStart}%` }}></div>*/}
          <div
            className="absolute top-0 w-2 h-5 -mt-1 bg-blue-500 cursor-ew-resize"
            style={{ left: `${trimStart}%` }}
            onMouseDown={(e) => handleTrimDragStart(e, true) }
            onClick={e => e.stopPropagation()}
          />
          <div
            className="absolute top-0 w-2 h-5 -mt-1 bg-blue-500 cursor-ew-resize"
            style={{ left: `${trimEnd}%` }}
            onMouseDown={(e) => handleTrimDragStart(e, false)}
            onClick={e => e.stopPropagation()}
          />
        </div>
      </div>
      </div>
    </div>
  );
  
};

export default YouTubePlayer;