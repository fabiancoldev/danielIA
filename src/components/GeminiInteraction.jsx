import { useState, useEffect } from 'react';
import { consultarGemini } from '../services/GeminiService';
import avatarImg from '../assets/img/avatar.png';

const GeminiInteraction = ({ datos, ubicacionBarco }) => {
  const [respuesta, setRespuesta] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [cargando, setCargando] = useState(false);
  const [historialChat, setHistorialChat] = useState([]);
  const [datosSensor, setDatosSensor] = useState(null);
  const [errorSensor, setErrorSensor] = useState(null);

  const hacerPregunta = async (e) => {
    e.preventDefault();
    setCargando(true);
    
    const nuevaPregunta = pregunta;
    setPregunta('');
    
    try {
      let datosConsulta;
      let respuestaGemini;
      
      // Verificar si la pregunta está relacionada con los datos disponibles
      const preguntaRelacionada = /clima|temperatura|humedad|presión|lluvia|viento|medición|sensor|barco|navegación|rumbo|velocidad|ubicación|coordenadas/i.test(nuevaPregunta);
      
      if (preguntaRelacionada && datos?.mediciones) {
        // Si la pregunta está relacionada con los datos disponibles, incluimos la información
        datosConsulta = {
          mediciones: {
            temperatura: datos.mediciones.temperatura,
            humedad: datos.mediciones.humedad,
            presion: datos.mediciones.presion
          },
          ubicacionBarco: {
            latitud: ubicacionBarco.latitud,
            longitud: ubicacionBarco.longitud,
            rumbo: ubicacionBarco.rumbo,
            velocidad: ubicacionBarco.velocidad
          },
          channelInfo: datos.channelInfo,
          preguntaUsuario: nuevaPregunta,
          contexto: "Responde usando los datos proporcionados de las mediciones y la ubicación del barco. Si la pregunta no se puede responder específicamente con estos datos, indícalo y proporciona información general sobre el tema."
        };
      } else {
        // Para cualquier otra pregunta, usamos Gemini sin datos específicos
        datosConsulta = {
          preguntaUsuario: nuevaPregunta,
          contexto: "Responde la pregunta de manera precisa y detallada utilizando tu conocimiento general. No menciones datos de sensores o mediciones específicas."
        };
      }

      respuestaGemini = await consultarGemini(datosConsulta);

      if (respuestaGemini) {
        setHistorialChat(prevHistorial => [...prevHistorial, {
          pregunta: nuevaPregunta,
          respuesta: respuestaGemini,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        throw new Error('Respuesta vacía del servicio');
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      
      setHistorialChat(prevHistorial => [...prevHistorial, {
        pregunta: nuevaPregunta,
        respuesta: 'Lo siento, hubo un problema al procesar tu pregunta. Por favor, intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setCargando(false);
    }
  };

  const manejarKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (pregunta.trim() && !cargando) {
        hacerPregunta(e);
      }
    }
  };

  const formatearTexto = (texto) => {
    // Primero quitamos "Respuesta:" si existe
    let textoLimpio = texto.replace(/^Respuesta:\s*/i, '');
    
    // Dividimos el texto en líneas
    const lineas = textoLimpio.split('\n');
    
    return lineas.map((linea, lineaIndex) => {
      // Si la línea comienza con * y un espacio, es un elemento de lista
      if (linea.trim().startsWith('* ')) {
        return (
          <div key={`linea-${lineaIndex}`} style={{ 
            marginLeft: '20px',
            textAlign: 'left'
          }}>
            • {formatearNegritas(linea.substring(2))}
          </div>
        );
      }
      
      // Si no es una lista, procesamos las negritas
      return <div key={`linea-${lineaIndex}`}>{formatearNegritas(linea)}</div>;
    });
  };

  const formatearNegritas = (texto) => {
    return texto.split(/(\*\*.*?\*\*)/).map((parte, index) => {
      if (parte.startsWith('**') && parte.endsWith('**')) {
        // Elimina los asteriscos y aplica negrita
        return <strong key={index}>{parte.slice(2, -2)}</strong>;
      }
      return parte;
    });
  };

  // Función auxiliar para generar respuestas básicas
  const generarRespuestaBasica = (pregunta) => {
    // Detectar si es una operación matemática simple
    const operacionMatch = pregunta.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    if (operacionMatch) {
      const [_, num1, operador, num2] = operacionMatch;
      let resultado;
      switch(operador) {
        case '+': resultado = parseFloat(num1) + parseFloat(num2); break;
        case '-': resultado = parseFloat(num1) - parseFloat(num2); break;
        case '*': resultado = parseFloat(num1) * parseFloat(num2); break;
        case '/': resultado = parseFloat(num1) / parseFloat(num2); break;
      }
      return `El resultado de la operación ${num1} ${operador} ${num2} = ${resultado}`;
    }
    
    return "Lo siento, no puedo acceder a los datos del clima en este momento, pero puedo ayudarte con información general sobre el tema.";
  };

  // Función para obtener datos del sensor en tiempo real
  const obtenerDatosSensor = async () => {
    try {
      const respuesta = await fetch('URL_DE_TU_API/datos-sensor');
      if (!respuesta.ok) {
        throw new Error('Error al obtener datos del sensor');
      }
      const datos = await respuesta.json();
      setDatosSensor(datos);
      setErrorSensor(null);
    } catch (error) {
      setErrorSensor('No se pudieron obtener los datos del sensor');
      console.error('Error:', error);
    }
  };

  // Usar useEffect para actualizar datos periódicamente
  useEffect(() => {
    // Primera carga de datos
    obtenerDatosSensor();

    // Actualizar cada 5 segundos (ajusta según necesidades)
    const intervalo = setInterval(() => {
      obtenerDatosSensor();
    }, 5000);

    // Limpiar intervalo al desmontar
    return () => clearInterval(intervalo);
  }, []);

  // Modificar la función de consulta para incluir datos en tiempo real
  const consultarIA = async (nuevaPregunta) => {
    setCargando(true);
    
    let datosConsulta;
    if (preguntaRelacionada && datosSensor) {
      datosConsulta = {
        preguntaUsuario: nuevaPregunta,
        contexto: "Responde la pregunta como un experto en matemáticas considerando los siguientes datos en tiempo real del barco:",
        datosSensor: datosSensor // Incluir datos actuales del sensor
      };
    } else {
      // Para cualquier otra pregunta, usamos Gemini sin datos específicos
      datosConsulta = {
        preguntaUsuario: nuevaPregunta,
        contexto: "Responde la pregunta de manera precisa y detallada utilizando tu conocimiento general. No menciones datos de sensores o mediciones específicas."
      };
    }

    try {
      let respuestaGemini;
      respuestaGemini = await consultarGemini(datosConsulta);

      if (respuestaGemini) {
        setHistorialChat(prevHistorial => [...prevHistorial, {
          pregunta: nuevaPregunta,
          respuesta: respuestaGemini,
          timestamp: new Date().toLocaleTimeString()
        }]);
      } else {
        throw new Error('Respuesta vacía del servicio');
      }
      
    } catch (error) {
      console.error('Error completo:', error);
      
      setHistorialChat(prevHistorial => [...prevHistorial, {
        pregunta: nuevaPregunta,
        respuesta: 'Lo siento, hubo un problema al procesar tu pregunta. Por favor, intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="gemini-interaction" style={{ 
      width: '100%', 
      maxWidth: '100vw',
      minWidth: '100%',
      boxSizing: 'border-box',
      margin: 0,
      padding: '1.5rem',
      backgroundColor: '#ffffff'
    }}>
      <div className="chat-header" style={{ 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div className="chat-info">
          <span className="status">En línea</span>
        </div>
      </div>
      
      <div className="chat-historial" style={{ 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {historialChat.map((mensaje, index) => (
          <div key={index} style={{
            width: '100%',
            marginBottom: '1.5rem',
          }}>
            {/* Mensaje del usuario */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '10px'
            }}>
              <div style={{
                maxWidth: '80%',
                backgroundColor: '#007bff',
                padding: '15px',
                borderRadius: '18px 18px 0 18px', // Forma de globo
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)' // Sombra suave
              }}>
                {mensaje.pregunta}
                <div style={{ fontSize: '12px', opacity: '0.8', marginTop: '5px' }}>{mensaje.timestamp}</div>
              </div>
            </div>

            {/* Mensaje de la IA */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '15px',
              justifyContent: 'flex-start'
            }}>
              <img 
                src={avatarImg} 
                alt="Avatar" 
                style={{
                  width: '45px',
                  height: '45px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #e1e1e1'
                }}
              />
              <div style={{
                maxWidth: '80%',
                backgroundColor: '#E3F2FD',
                padding: '15px',
                borderRadius: '18px 18px 18px 0',
                fontSize: '16px',
                lineHeight: '1.5',
                color: '#000000',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                textAlign: 'left'
              }}>
                {formatearTexto(mensaje.respuesta)}
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginTop: '5px',
                  textAlign: 'left'
                }}>{mensaje.timestamp}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={hacerPregunta} className="chat-input-container" style={{ 
        width: '100%',
        boxSizing: 'border-box',
        marginTop: '20px'
      }}>
        <textarea
          style={{
            width: '100%',
            minWidth: '80vw',
            boxSizing: 'border-box',
            padding: '15px',
            borderRadius: '12px',
            border: '2px solid #ddd',
            fontSize: '16px',
            resize: 'none',
            outline: 'none',
            fontFamily: 'Arial, sans-serif',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
          onKeyDown={manejarKeyDown}
          placeholder="Pregunta sobre el clima, la navegación o la ubicación del barco..."
          rows="3"
          className="pregunta-input"
        />
        <button 
          type="submit" 
          style={{
            marginTop: '10px',
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Enviar
        </button>
      </form>

      {cargando && (
        <div className="estado-carga">
          <span className="typing-indicator">El experto está escribiendo...</span>
        </div>
      )}
    </div>
  );
};

export default GeminiInteraction; 