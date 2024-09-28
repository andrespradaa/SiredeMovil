import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { showMessage } from "react-native-flash-message";
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from './Config';

const CortesAcademicos = ({ selectedProgram, onNext }) => {
  const navigation = useNavigation();
  const [cortesIniciales, setCortesIniciales] = useState([]);
  const [cortesFinales, setCortesFinales] = useState([]);
  const [selectedCorteInicial, setSelectedCorteInicial] = useState('');
  const [selectedCorteFinal, setSelectedCorteFinal] = useState('');
  const [modalCorteInicialVisible, setModalCorteInicialVisible] = useState(false);
  const [modalCorteFinalVisible, setModalCorteFinalVisible] = useState(false);
  const [datosBackend, setDatosBackend] = useState({
    graduados: [],
    retenidos: [],
    desertores: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const obtenerCortesIniciales = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cortes-iniciales`);
        const data = await response.json();
        console.log(data)
        if (Array.isArray(data)) {
          setCortesIniciales(data);
        } 
      } catch (error) {
       
      }
    };

    obtenerCortesIniciales();
  }, []);
 // Función para generar cortes finales
 const generarCortes = (anio, periodo, cantidadSemestres) => {
  const cortes = [];
  let anioActual = anio;
  let periodoActual = periodo;

  for (let i = 0; i < cantidadSemestres; i++) {
    cortes.push({ label: `${anioActual}-${periodoActual}`, key: `${anioActual}-${periodoActual}` });

    if (periodoActual === 1) {
      periodoActual = 2;
    } else {
      periodoActual = 1;
      anioActual += 1;
    }
  }

  return cortes;
};

useEffect(() => {
  const cargarCortesFinales = () => {
      if (!selectedCorteInicial || typeof selectedCorteInicial !== 'string' || !selectedProgram.cod_snies) return;

      // Obtener año y periodo del corte inicial
      const [anioInicial, periodoInicial] = selectedCorteInicial.split('-').map(Number);
      
     
      const programaSeleccionadoData = selectedProgram; 

      let cantidadSemestres = 0;

      if (programaSeleccionadoData) {
          if (programaSeleccionadoData.tipo === "Profesional") {
              cantidadSemestres = 4; // 4 periodos (2 años) para programas profesionales
          } else if (programaSeleccionadoData.tipo === "Tecnologia") {
              cantidadSemestres = 6; // 6 periodos (3 años) para programas tecnológicos
          }
      } else {
          console.error("Programa seleccionado no encontrado.");
          return; // Salimos si el programa no se encuentra
      }

      // Generar los cortes finales según el tipo de programa
      const cortesFinalesCalculados = generarCortes(anioInicial, periodoInicial, cantidadSemestres);

      // Agregar cortes iniciales posteriores al corte calculado
      cortesIniciales.forEach((corte) => {
          if (corte.key > selectedCorteInicial) {
              cortesFinalesCalculados.push({ label: corte.key, key: corte.key });
          }
      });
    
  // Obtener solo el último corte
     const ultimoCorteFinal = [];
     ultimoCorteFinal.push(cortesFinalesCalculados[cortesFinalesCalculados.length - 1])


      // Actualizar estado con los cortes finales generados
      setCortesFinales(ultimoCorteFinal);
  };

  cargarCortesFinales();
}, [selectedCorteInicial, cortesIniciales]);


  const corteInicialSelect = (corteInicial) => {
    setSelectedCorteInicial(corteInicial);
    setSelectedCorteFinal('');
    setModalCorteInicialVisible(false);
  };

  const corteFinalSelect = (corteFinal) => {
    setSelectedCorteFinal(corteFinal);
    setModalCorteFinalVisible(false);
  };

  const cancelarModal = () => {
    setModalCorteInicialVisible(false);
    setModalCorteFinalVisible(false);
  };

  const capitalizeFirstLetter = (string) => {
    return string
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const evaluarClick = async () => {
    try {
      if (!selectedProgram || !selectedCorteInicial || !selectedCorteFinal) {
        showMessage({
          message: "Error",
          description: "Por favor seleccione todos los datos necesarios",
          duration: 2500,
          titleStyle: { fontSize: 18, fontFamily: 'Montserrat-Bold' },
          textStyle: { fontSize: 16, fontFamily: 'Montserrat-Regular' },
          type: "danger",
          icon: "danger",
        });
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/estadisticasPdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          programa: selectedProgram.cod_snies,
          corteInicial: selectedCorteInicial,
          corteFinal: selectedCorteFinal,
        }),
      });

      const data = await response.json();
      //console.log('Datos recibidos del backend:', data);
      setDatosBackend(data);
      data.carrera=selectedProgram;
      
      if (typeof onNext === 'function') {
        onNext({
          data,
          selectedCorteInicial,
          selectedCorteFinal
        });
      } else {
        console.warn('onNext no está definida como una función.');
      }
    } catch (error) {
      console.error('Error al obtener datos del backend:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      datosBackend.graduados.length !== 0 ||
      datosBackend.retenidos.length !== 0 ||
      datosBackend.desertores.length !== 0
    ) {
      const timeout = setTimeout(() => {
       
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [datosBackend, onNext]);

  return (
    <View style={styles.container}>
      {selectedProgram && (
        <Text style={styles.title}>{capitalizeFirstLetter(selectedProgram.programa)}</Text>
      )}

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
                  onPress={() => corteInicialSelect(corte)}
                >
                  <Text style={styles.modalItemTextCorte}>{corte}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelarModal}
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
                onPress={() => corteFinalSelect(corte.label)}
              >
                <Text style={styles.modalItemTextCorte}>{corte.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelarModal}
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
            <View>
              <ActivityIndicator size="large" color="#fff" />
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
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop:-0,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    marginTop:-30,
    marginBottom: 20,
    textAlign: 'center',
    color: '#34531F',
  
  },
  buttonCorte: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#575756',
    marginBottom: 10,
    borderRadius: 8,
  },
  buttonTextCortes: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#Fff',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 20,
    textAlign: 'center',
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#34531F',
  },
  modalItemContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalItemTextCorte: {
    fontSize: 30,
    fontFamily: 'Montserrat-Bold',
    textAlign: 'center',
    color: '#666',
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: '#f44336',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    width: 150,
    alignSelf: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  evaluarButton: {
    width: '60%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B3B3B3',
    marginTop: 20,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
    color: '#34531F',
    textAlign:'center'
  },
});

export default CortesAcademicos;
