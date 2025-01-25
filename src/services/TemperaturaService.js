const API_URLS = {
  temperatura: 'https://api.thingspeak.com/channels/2725294/fields/1.json?api_key=4GJUDX2FY69PYRNU&results=2',
  humedad: 'https://api.thingspeak.com/channels/2725294/fields/2.json?api_key=4GJUDX2FY69PYRNU&results=2',
  presion: 'https://api.thingspeak.com/channels/2725294/fields/3.json?api_key=4GJUDX2FY69PYRNU&results=2'
};

export const getAllSensorData = async () => {
  try {
    const response = await fetch(API_URLS.temperatura);
    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }
    const data = await response.json();

    console.log('Respuesta Temperatura:', data);

    const ultimaMedicion = {
      temperatura: data.feeds[data.feeds.length - 1].field1 === 'nan' ? null : parseFloat(data.feeds[data.feeds.length - 1].field1),
      humedad: data.feeds[data.feeds.length - 1].field2 === 'nan' ? null : parseFloat(data.feeds[data.feeds.length - 1].field2),
      presion: data.feeds[data.feeds.length - 1].field3 === 'nan' ? null : parseFloat(data.feeds[data.feeds.length - 1].field3)
    };

    return {
      channelInfo: {
        id: data.channel.id,
        nombre: data.channel.name,
        descripcion: data.channel.description,
        ubicacion: {
          latitud: data.channel.latitude,
          longitud: data.channel.longitude
        },
        campos: {
          temperatura: data.channel.field1,
          humedad: data.channel.field2,
          presionAtmosferica: data.channel.field3
        },
        fechaCreacion: new Date(data.channel.created_at),
        ultimaActualizacion: new Date(data.channel.updated_at)
      },
      mediciones: {
        ...ultimaMedicion,
        timestamp: new Date(data.feeds[data.feeds.length - 1].created_at)
      }
    };
  } catch (error) {
    console.error('Error al obtener datos:', error);
    throw error;
  }
}; 