import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { RunnablePassthrough, RunnableWithMessageHistory, RunnableLambda, RunnableParallel } from "@langchain/core/runnables";
import { prompts } from "./prompts";
import { NextRequest,NextResponse } from 'next/server';
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { retriever } from "./retriever";
import { ChatOpenAI } from "@langchain/openai";

const apiKey=process.env.OPENAI_API_KEY

// Store for session-based message history
let store :{[key:number]:InMemoryChatMessageHistory}={};
// Retrieve message history based on session ID
function getMessageHistory(session_id:number) {
    console.log("Session_id",session_id)
    if (!(session_id in store)) {
        store={}
        store[session_id] = new InMemoryChatMessageHistory();
    }
    return store[session_id];
}
export async function POST(req:NextRequest){

        const body=await req.json();

    //console.log(apiKey)
    // Initialize ChatOpenAI with the API key
    const schema = {
        "type": "object",
        "properties": {
            "response1": {
                "type": "string",
                "description": "Generate the response for assisting the customer,You are a friendly and professional waiter at a restaurant"
            },
            "response2": {
                "type":"array",
                "description":"Generate an order summary **only when the customer has explicitly ordered an item**.Ensure:"+
                                "-Do not include, remove, or update the order when the customer asks for recommendations, suggestions, the menu, or when no valid menu item is ordered."+
                                "-Do not include, remove, or send the order response again when no valid menu item is ordered ."+
                                "-Do not include the order summary after confirmation or when the customer asks for confirmation or opts for payment."+                           
                                "- If an item is canceled, update the item's quantity accordingly (subtracting the canceled quantity) and provide only the updated details without showing the subtracted quantity explicitly.",
                                "items":{
                                        "type": "object",
                                        "properties":{
                                            "Quantity":{
                                                "type":"number",
                                                "description":"Provide the quantity for each identical item ordered by the customer.",
                                            },
                                                "item":{
                                                    "type":"string",
                                                    "description":"Provide the name of the each ordered item. ",
                                                },
                                                    "price":{
                                                        "type":"number",
                                                        "description":" Provide the price of each ordered item",
                                                },
                                                "payment_option":{
                                                    "type":"string",
                                                    "description":"Respond only with the payment option chosen by the customer after confirmation."
                                                }
                                        }
                                 }
            }
        },
        "required": ["response1", "response2"]
    }
    

    const parser = new JsonOutputParser();

    const llm = new ChatOpenAI({
        model: "gpt-4o", // Ensure this is a valid model name
        temperature: 0.7,
        apiKey,
        streaming:true
    }).withStructuredOutput(schema)

    // Create a parallel chain with steps for retrieving context and handling the question
        const chain = new RunnableParallel({
            steps: {
                context: new RunnableLambda({func:(input:Record<string,string>) => input.question}).pipe(retriever), // This will retrieve context based on the user input
                question: new RunnablePassthrough(), // Simply passes the question through
                }
                }).pipe(prompts) // Applies the prompts
                .pipe(llm)      // Passes through the language model
                

        // Add message history handling
        const chain_with_history = new RunnableWithMessageHistory({
            runnable: chain,
            getMessageHistory,
            inputMessagesKey: "question",
            outputMessagesKey:"response1",
            historyMessagesKey: "history",
        });
        
        const input=body.user_input
        const order_number=body.order_number
        console.log(input)
            // Invoke the chain with history, providing question input and session ID
    const response = await chain_with_history.invoke(
        { question: input},
        { configurable: { sessionId: order_number } } // This passes the session ID as an option  
    );
    console.log(response)
      return NextResponse.json(response)
   
}
