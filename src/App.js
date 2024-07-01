import React, { useState } from 'react';

const API_URL = '/.netlify/functions/analyze-image';

function App() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!image) {
      alert('Please upload an image first.');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ image })
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data.result);
      } else {
        throw new Error(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Image Analysis with GPT-4o Vision</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {image && <img src={image} alt="Uploaded" style={{ maxWidth: '300px', marginTop: '20px' }} />}
      <button onClick={analyzeImage} disabled={!image || isLoading}>
        {isLoading ? 'Analyzing...' : 'Analyze Image'}
      </button>
      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Analysis Result:</h2>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;