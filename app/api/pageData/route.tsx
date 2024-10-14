

import { NextResponse } from "next/server";
import { jsonData, searchData } from "@/lib/JsonUtil";

export async function GET(req: any){

    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.searchParams);

    if(searchParams.get("page") == null){
        return NextResponse.json({error:"no page parameter"});
    }

    const pageSize = 10;
    const page = Number(searchParams.get("page"));
    const startIndex = (page-1)*pageSize;
    const endIndex = (page*pageSize)

    let data = await jsonData();

    const query = searchParams.get("query")
    if(searchParams.has("query")){
        console.log("THERE WAS A QUERY:" + query)
        data = searchData(data,query)
    } else {
        console.log("Query Was: "+query)
    }

    const totalPages = Math.ceil(data.length/pageSize)

    const responseData= {
        totalPages: totalPages,
        data: data.slice(startIndex,endIndex)
    }


    return NextResponse.json(responseData);
}