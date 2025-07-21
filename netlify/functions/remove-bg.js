exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    // Hanya izinkan POST method
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Parse body untuk mendapatkan image data
        const body = JSON.parse(event.body);
        const imageBase64 = body.image.split(',')[1]; // Remove data:image/...;base64, prefix
        
        // Convert base64 ke buffer
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        
        // Import fetch menggunakan dynamic import untuk kompatibilitas
        const fetch = (await import('node-fetch')).default;
        const FormData = (await import('form-data')).default;
        
        // Buat FormData untuk API remove.bg
        const formData = new FormData();
        formData.append('image_file', imageBuffer, {
            filename: 'image.png',
            contentType: 'image/png'
        });
        formData.append('size', 'auto');

        // Panggil API remove.bg dengan API key dari environment variable
        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': process.env.REMOVE_BG_API_KEY, // API key aman di environment variable
                ...formData.getHeaders()
            },
            body: formData,
        });

        if (response.ok) {
            const imageBuffer = await response.buffer();
            const base64Image = imageBuffer.toString('base64');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    image: `data:image/png;base64,${base64Image}`
                }),
            };
        } else {
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: `API Error: ${response.status}`
                }),
            };
        }
    } catch (error) {
        console.error('Error processing image:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error'
            }),
        };
    }
};
