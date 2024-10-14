import { promises as fs } from 'fs';
import { rData } from './definitions';

export async function jsonData(){
    const file = await fs.readFile(process.cwd() + '/lib/data.json', 'utf8');
    const jsonData = JSON.parse(file);
    
    const returnData: rData[] = []
  
    jsonData.items.forEach(i => {
      if(i.id.videoId != null){
        returnData.push(
          {
            videoId: i.id.videoId,
            title: i.snippet.title,
            description: i.snippet.description
          })
        }
    });
  

    return returnData;
  }

  export function searchData(jsonData:rData[],query:string){
    const hits: rData[] = []

    jsonData.forEach(i =>{
      
      if(i.title.toLowerCase().search(query.toLowerCase()) !== -1){
        hits.push(i)
      }

    })

    return hits
  }