import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_API_KEY);


export const consultarGemini = async (datos) => {
  try {
    // Depurar los datos de entrada
    console.log('Datos recibidos:', datos);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Extraer los datos relevantes del objeto de la API
    const ubicacion = {
      latitud: datos?.channel?.latitude || null,
      longitud: datos?.channel?.longitude || null
    };

    const mediciones = {
      temperatura: datos?.feeds?.[datos.feeds.length - 1]?.field1 || 'No disponible',
      humedad: datos?.feeds?.[datos.feeds.length - 1]?.field2 || 'No disponible',
      presion: datos?.feeds?.[datos.feeds.length - 1]?.field3 || 'No disponible'
    };

    // Verificar si hay datos de ubicación válidos
    if (!ubicacion.latitud || !ubicacion.longitud) {
      return "No hay datos de ubicación disponibles";
    }

    // Crear un prompt más detallado que incluya información sobre coordenadas
    const prompt = `
      Eres un experto en cualquier tema. Debes interpretar coordenadas y ubicaciones con precisión.
      
      Los datos actuales son:
      Temperatura: ${mediciones.temperatura} °C
      Humedad: ${mediciones.humedad} %
      Presión: ${mediciones.presion} hPa
      
      Ubicación del barco (Actualizada):
      Latitud: ${ubicacion.latitud}
      Longitud: ${ubicacion.longitud}
      
      Instrucciones para interpretar coordenadas:
      - Latitud: ${ubicacion.latitud} (Positiva = Norte/N, Negativa = Sur/S)
      - Longitud: ${ubicacion.longitud} (Positiva = Este/E, Negativa = Oeste/W)
      
      Por ejemplo:
      - 3.43722, -76.5225 corresponde a Cali, Colombia
      - -12.0464, -77.0428 corresponde a Lima, Perú
      - -33.4489, -70.6693 corresponde a Santiago, Chile
      
      Formatea tu respuesta exactamente así:

      📍 UBICACIÓN ACTUAL
      Ciudad: [nombre de la ciudad más cercana]
      País: [nombre del país]
      
      🗺️ REFERENCIAS GEOGRÁFICAS
      • [Lista de referencias geográficas importantes]
      • [Ríos, montañas, costas cercanas]
      • [Otros puntos de interés]
      
      🌊 TIPO DE UBICACIÓN
      [Especificar si es costera o interior]
      
      ℹ️ INFORMACIÓN ADICIONAL
      [Cualquier dato relevante sobre la ubicación]
      
      Pregunta: ${datos?.preguntaUsuario || 'Sin pregunta'}
    `;

    console.log('Prompt enviado:', prompt);

    const result = await model.generateContent(prompt);
    console.log('Resultado de Gemini:', result);

    const response = await result.response;

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`);
    }

    const textResponse = await response.text(); // Obtener el texto de la respuesta

    // Intentar parsear el texto como JSON
    try {
      const jsonResponse = JSON.parse(textResponse);
      console.log('Respuesta procesada:', jsonResponse);
      return jsonResponse; // Retornar el JSON procesado
    } catch (jsonError) {
      throw new Error('La respuesta no es un JSON válido');
    }
  } catch (error) {
    console.error('Error en consultarGemini:', error);
    return `Lo siento, ocurrió un error: ${error.message}`;
  }
}; 