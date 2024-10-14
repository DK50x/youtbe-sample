"use client";

import {
    Card,
    CardDescription,
    CardTitle,
  } from "@/components/ui/card"
import {
    PaginationContent,
    PaginationItem,
    PaginationLink,
  } from "@/components/ui/pagination"
import { useState, useEffect } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { rData } from "@/lib/definitions";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button";

export default function LeftNav() {
    const [localData, setLocalData] = useState<rData[]>([])
    const [pages,setPages] = useState<number[]>([])
    const [search,setSearch] = useState<string>("")

    const searchParams = useSearchParams();

    const page = searchParams.get('page') || '1'
    const query = searchParams.get('query') || null

    useEffect(() => {
        
        const url = query ? `/api/pageData?page=${page}&query=${query}` :
                            `/api/pageData?page=${page}`

        fetch(encodeURI(url))
          .then((res) => res.json())
          .then((data) => {
            setLocalData(data.data)
            const pagesArray = []

            for(let i=1;i<=data.totalPages;i++){
                pagesArray.push(i)
            }

            setPages(pagesArray)
          })
      }, [page,query])



    const pathname = usePathname();
    const { replace } = useRouter();

    const handleCardClick = (videoId:string) =>{
        const params = new URLSearchParams(searchParams);
        params.set('videoId',videoId)
        replace(`${pathname}?${params.toString()}`);
    }

    const handlePageClick = (pageNumber:number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page',pageNumber.toString())
        replace(`${pathname}?${params.toString()}`);
    }

    const handleSearchClick = (searchString:string) => {
      const params = new URLSearchParams(searchParams);
      params.set('query',searchString)
      replace(`${pathname}?${params}`);
   }

    const handleClearClick = (searchString:string) => {
      const params = new URLSearchParams(searchParams);
      params.delete('query')
      replace(`${pathname}?${params}`);
    }

    return(

      <div className="flex h-screen flex-col w-72 h-screen">
      <div className="flex flex-col items-center h-full px-3 py-4 overflow-y-auto bg-gray-900">
      <div className="flex flex-col items-center justify-center my-3">
      <div className="flex mb-2">
       <Input  className="mx-3"
       placeholder="Search"
       onChange={(e)=>setSearch(e.target.value)}/>
       { !query && <Button className="p-1"
       variant={"secondary"}
       onClick={()=>handleSearchClick(search)}>Search</Button>}
       { query && <Button className="p-1"
       variant={"secondary"}
       onClick={()=>handleClearClick(search)}>Clear</Button>}
      </div>
      <PaginationContent className="mt-3">
        {pages.map(i=>( 
            <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={()=>handlePageClick(i)}>{i}</PaginationLink>
            </PaginationItem>
        )  )}
      </PaginationContent>
      </div>
      <div className="flex flex-col items-center">
      {localData.map( ({videoId,title,description}) =>(
            <Card key={videoId} className="w-56 p-4 m-2 cursor-pointer bg-gray-950"
            onClick={()=>handleCardClick(videoId)}>
              <CardTitle className="py-2">{title}</CardTitle>
              <CardDescription className="break-words">{description}</CardDescription>
            </Card>

        ))}
        { query && localData.length === 0 && <h1 className="text-lg">No Results</h1>}
        </div>
      </div>
   </div>

    );
};