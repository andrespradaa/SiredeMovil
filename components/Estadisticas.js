import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ImageBackground, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { showMessage } from "react-native-flash-message";
import { useNavigation } from '@react-navigation/native'; 
import { API_BASE_URL } from './Config';

const Estadisticas = () => {
  const navigation = useNavigation();
  const [programas, setProgramas] = useState([]);
  const [cortesIniciales, setCortesIniciales] = useState([]);
  const [cortesFinales, setCortesFinales] = useState([]);
  const [programaSeleccionado, setProgramaSeleccionado] = useState('');
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [selectedCorteInicial, setSelectedCorteInicial] = useState('');
  const [selectedCorteFinal, setSelectedCorteFinal] = useState('');
  const [modalProgramaVisible, setModalProgramaVisible] = useState(false);
  const [modalCorteInicialVisible, setModalCorteInicialVisible] = useState(false);
  const [modalCorteFinalVisible, setModalCorteFinalVisible] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [datosBackend, setDatosBackend] = useState({
    totalEstp: 0,
    totalGra: 0,
    totalRet: 0,
    totalDes: 0,
  });

  useEffect(() => {
    const obtenerProgramas = async () => {
      try {
          const response = await fetch(`${API_BASE_URL}/api/programas`);
          const data = await response.json();
          const filteredData = data.map(element => ({
              cod_snies: element.cod_snies,
              programa: element.programa,
              tipo: element.tipo,
          }));
          setProgramas(filteredData); // Guarda solo cod_snies, programa y tipo
      } catch (error) {
          console.error('Error al obtener programas:', error);
      }
  };

    const obtenerCortesIniciales = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cortes-iniciales`);
        const data = await response.json();
        if (Array.isArray(data)) {
          const datCortes = data.map(element => `${element.ano}-${element.periodo}`);
          setCortesIniciales(datCortes);
        } 
      } catch (error) {
        console.error('Error al obtener cortes iniciales:', error);
      }
    };

    obtenerProgramas();
    obtenerCortesIniciales();
  }, []);

  useEffect(() => {
    const cargarCortesFinales = () => {
      if (!selectedCorteInicial || typeof selectedCorteInicial !== 'string') return;

      const cortesFinalesCalculados = [];
      let anoi, anof, peri, perf;
      const [ai, pi] = selectedCorteInicial.split('-');
      anoi = parseInt(ai);
      peri = parseInt(pi);

      if (peri === 1) {
        anof = anoi + 3;
        perf = 2;
      } else {
        anof = anoi + 4;
        perf = 1;
      }

      cortesFinalesCalculados.push({ label: `${anof}-${perf}`, key: `${anof}-${perf}` });

      cortesIniciales.forEach((corte) => {
        if (parseInt(corte.split('-')[0]) > anof) {
          cortesFinalesCalculados.push({ label: corte, key: corte });
        }
      });

      setCortesFinales(cortesFinalesCalculados);
      setSelectedCorteFinal('');
    };

    cargarCortesFinales();
  }, [selectedCorteInicial, cortesIniciales]);

  useEffect(() => {
    if ((datosBackend.totalEstp !== 0 || datosBackend.totalGra !== 0 || datosBackend.totalRet !== 0 || datosBackend.totalDes !== 0)) {
        const timeout = setTimeout(() => {
          setLoading(false);
          navigation.navigate('Graficar', {
            selectedCorteInicial,
            selectedCorteFinal,
            programaSeleccionado,
            datosBackend: {
              totalEstp: datosBackend.totalEstp,
              totalGra: datosBackend.totalGra,
              totalRet: datosBackend.totalRet,
              totalDes: datosBackend.totalDes,
            },
          });
        }, 2500);
  
        return () => clearTimeout(timeout);
      }
  }, [datosBackend]);
  
  

  const ProgramaSelect = (programa) => {
    setProgramaSeleccionado(programa.programa);
    setCodigoSeleccionado(programa.cod_snies);
    setModalProgramaVisible(false);
  };

  const handleCorteInicialSelect = (corteInicial) => {
    setSelectedCorteInicial(corteInicial);
    setSelectedCorteFinal('');
    setModalCorteInicialVisible(false);
  };

  const handleCorteFinalSelect = (corteFinal) => {
    setSelectedCorteFinal(corteFinal);
    setModalCorteFinalVisible(false);
  };

  const handleCancelarModal = () => {
    setModalProgramaVisible(false);
    setModalCorteInicialVisible(false);
    setModalCorteFinalVisible(false);
  };

  
  const evaluarClick = async () => {
    try {
      if (!programaSeleccionado || !selectedCorteInicial || !selectedCorteFinal) {
        showMessage({
          message: "Error",
          description: "Por favor seleccione todos los datos necesarios",
          duration: 3000, // Duración del mensaje en milisegundos
          titleStyle: { fontSize: 18, fontFamily: 'Montserrat-Bold' }, // Estilo del título
          textStyle: { fontSize: 16, fontFamily: 'Montserrat-Regular' }, // Estilo del texto
          type: "danger",
          icon: "danger",
        });
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/estadisticas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programa: codigoSeleccionado,
          corteInicial: selectedCorteInicial,
          corteFinal: selectedCorteFinal,
        }),
      });

      const data = await response.json();
      setDatosBackend(data);
      setLoading(true); // Mostrar el modal de carga
      
    } catch (error) {
      console.error('Error al obtener datos del backend:', error);
    }
  };


  return (
    <ImageBackground source={require('../assets/fondoinicio.jpg')} style={styles.backgroundImage}>
    <View style={styles.container}>
      <Text style={styles.title}>Estadísticas</Text>
      <Text style={styles.subtitle}>Seleccione el programa académico y los rangos a evaluar:</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => setModalProgramaVisible(true)}>
        <Text style={styles.buttonText}>
          {programaSeleccionado ? `${programaSeleccionado}` : 'Seleccionar Programa'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonCorte} onPress={() => setModalCorteInicialVisible(true)}>
        <Text style={styles.buttonTextCortes}>
          {selectedCorteInicial ? `Corte inicial: ${selectedCorteInicial}` : 'Seleccionar Corte Inicial'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonCorte} onPress={() => setModalCorteFinalVisible(true)}>
        <Text style={styles.buttonTextCortes}>
          {selectedCorteFinal ? `Corte final: ${selectedCorteFinal}` : 'Seleccionar Corte Final'}
        </Text>
      </TouchableOpacity>
 
      {/* Modal para seleccionar el Programa academico */}
      <Modal
          animationType="slide"
          transparent={true}
          visible={modalProgramaVisible}
          onRequestClose={() => setModalProgramaVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Seleccione un programa</Text>
              <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {programas.map((programa, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItemContainer}
                    onPress={() => ProgramaSelect(programa)}
                  >
                    <Text style={styles.modalItemText}>{programa.programa}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            {/* Botón de cancelar */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelarModal}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar Corte Inicial */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCorteInicialVisible}
        onRequestClose={() => setModalCorteInicialVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccione un corte inicial</Text>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {cortesIniciales.map((corte, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItemContainer}
                    onPress={() => handleCorteInicialSelect(corte)}
                  >
                    <Text style={styles.modalItemTextCorte}>{corte}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelarModal}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar Corte Final */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalCorteFinalVisible}
        onRequestClose={() => setModalCorteFinalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccione un corte final</Text>
            {cortesFinales.map((corte, index) => (
              <TouchableOpacity
                key={index}
                style={styles.modalButton}
                onPress={() => handleCorteFinalSelect(corte.label)}
              >
                <Text style={styles.modalItemTextCorte}>{corte.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelarModal}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

           {/* Modal para mostrar la pantalla de carga */}
           <Modal
                  animationType="fade"
                  transparent={true}
                  visible={loading}
                >
                  <View style={styles.modalContainer}>
                    {loading && (
                      <View >
                        <ActivityIndicator size="large" color="#132F20" />
                        <Text style={styles.loadingText}>Cargando...</Text>
                      </View>
                    )}
                  </View>
                </Modal>

      {/* Botón para evaluar */}
      <TouchableOpacity style={styles.evaluarButton} onPress={evaluarClick}>
        <Text style={styles.buttonText}>Evaluar</Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container:{
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Montserrat-Bold',
    alignSelf: 'flex-start',
    marginBottom: 20,
    color: '#C3D730',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Medium',
    alignSelf: 'flex-start',
    color: '#132F20',
    marginBottom: 50,
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#34531F',
    marginBottom: 10,
    borderRadius: 8,
  },
  buttonCorte: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8E9D4',
    marginBottom: 10,
    borderRadius: 8,
  },
  evaluarButton: {
    width: '60%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6D100A',
    marginTop: 20,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#F8E9D4',
    textAlign:'center'
  },
  buttonTextCortes: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#34531F',
    textAlign:'center'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    textAlign:'center',
    width: '80%',
    maxHeight: '70%',
    
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    textAlign:'center',
    marginBottom: 10,
    color: '#34531F',
  },
  modalItemContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalItemText: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    textAlign:'center',
    color: '#666',
  },
  modalItemTextCorte: {
    fontSize:30,
    fontFamily: 'Montserrat-Bold',
    textAlign:'center',
    color: '#666',
  },
  cancelButton: {
    marginTop: 50,
    backgroundColor: '#f44336', // Color de fondo rojo, puedes cambiarlo según tu preferencia
    paddingVertical: 10,
    justifyContent: 'center', // Centra verticalmente
    alignItems: 'center', // Centra horizontalmente
    borderRadius: 8,
    width: 150, // Ancho del botón, ajusta según tu diseño
    alignSelf: 'center', // Centra el botón horizontalmente
  },
  cancelButtonText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#fff', // Color del texto blanco, puedes cambiarlo según tu preferencia
  },
  resultadosContainer: {
    marginVertical: 10,
  },
  resultadosText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    textAlign:'center',
    color: '#34531F',
  },
  analisisText: {
    padding:20,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    textAlign:'center',
    color: '#575756',
  },
  
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
});

export default Estadisticas;
