self.onmessage = async (event) => {
  const { submittedValue, count, order_list } = event.data;
 
  try {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_input: submittedValue, order_number: count}),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data)
    if(!JSON.stringify(data.response1).toLowerCase().includes('thank')){
      self.postMessage({ result: data,incrementCount:false });
    }

    if (JSON.stringify(data.response1).toLowerCase().includes('thank')) {
      self.postMessage({ result: data,incrementCount: true });
    }
  } catch (error) {
    self.postMessage({ error: error });
  }

};
