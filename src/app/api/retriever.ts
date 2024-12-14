import * as fs from "node:fs";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from 'path';
import { FaissStore } from "@langchain/community/vectorstores/faiss";

export async function retriever() {
  try {

  // Get the API key from environment variables
    //console.log(apiKey)
    // Define the directory and file name
    const data = path.join(process.cwd(),'public','/Menu.csv');

    // Read the file
    const text = fs.readFileSync(data, 'utf8');
    //console.log("question:",filter)

    // Initialize the text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({  chunkSize: 300, // Adjust as needed
      chunkOverlap: 0, // Avoid overlapping chunks,
      separators:["\n"]
    });
    const docs = await textSplitter.createDocuments([text]);

    // Create a vector store from the documents, passing the apiKey to OpenAIEmbeddings
    const vectorStore = await FaissStore.fromDocuments(
      docs,
      new OpenAIEmbeddings({openAIApiKey:process.env.OPENAI_API_KEY}) // Ensure the API key is passed here
    );

    // Initialize a retriever wrapper around the vector store
    const vectorStoreRetriever = vectorStore.asRetriever({ k: 4 });
    // Return the retriever
    return vectorStoreRetriever;
    
  } catch (error) {
    console.error("Error in retriever function:", error);
    throw error; // Optional: Re-throw the error if you want to handle it higher up
  }
}