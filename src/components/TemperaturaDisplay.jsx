import { useState, useEffect } from 'react';
import { getAllSensorData } from '../services/TemperaturaService';
import GeminiInteraction from './GeminiInteraction';

const TemperaturaDisplay = () => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        console.log('Obteniendo datos...');
        const resultado = await getAllSensorData();
        console.log('Datos obtenidos:', resultado);
        if (resultado) {
          setDatos(resultado);
        } else {
          throw new Error('No se recibieron datos válidos');
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos');
      } finally {
        setCargando(false);
      }
    };

    obtenerDatos();
  }, []);

  if (cargando) return <div className="estado-carga">Cargando datos del sensor...</div>;
  if (error) return <div className="error-mensaje">{error}</div>;
  if (!datos) return <div className="sin-datos">No hay datos disponibles</div>;

  return (
    <div className="temperatura-container">
      <div className="datos-sensor">
        <h2>Datos del Sensor</h2>
        <p>📍 Ubicación: {datos.channelInfo.ubicacion.latitud}, {datos.channelInfo.ubicacion.longitud}</p>
        <p>🌡️ Temperatura actual: {datos.mediciones.temperatura !== null ? `${datos.mediciones.temperatura}°C` : 'No disponible'}</p>
        <p>💧 Humedad: {datos.mediciones.humedad !== null ? `${datos.mediciones.humedad}%` : 'No disponible'}</p>
        <p>🌪️ Presión: {datos.mediciones.presion !== null ? `${datos.mediciones.presion} hPa` : 'No disponible'}</p>
      </div>

      {datos && <GeminiInteraction datos={datos} />}
    </div>
  );
};

export default TemperaturaDisplay; 