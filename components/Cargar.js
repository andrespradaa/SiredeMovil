import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { showMessage } from "react-native-flash-message";
import { FontAwesome5 } from '@expo/vector-icons'; 
import { CheckBox } from '@rneui/themed'; // Importar CheckBox desde @rneui/themed
import { API_BASE_URL } from './Config';

const CargarCSV = () => {
  const [csvData, setCsvData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [selectedOption, setSelectedOption] = useState(''); // Nuevo estado para checkbox
  const [isModalVisible, setModalVisible] = useState(false);  
  const [parsedProgram, setParsedProgram] = useState('');  // Programa obtenido del CSV
  const [isGraduadosFormat, setIsGraduadosFormat] = useState(false); // Estado para el formato de graduados
  const [isNormalFormat, setIsNormalFormat] = useState(false); // Estado para el formato normal



  const options = [
    { label: 'Tecnología', value: 'Tecnologia' },
    { label: 'Profesional', value: 'Profesional' }
  ];

  const capitalizeFirstLetter = (string) => {
    return string
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
      });

      if (!res.canceled) {
        const fileUri = res.assets[0].uri;
        const name = res.assets[0].name;
        setFileName(name);
        
        const response = await fetch(fileUri);
        const csvContent = await response.text();
  
        Papa.parse(csvContent, {
          header: true,
          complete: (results) => {
            setCsvData(results.data);
    
              // Comprobar y actualizar los estados de formato aquí
            const isGraduadosFormat = /^graduados_\d{4}-(1|2)\.csv$/.test(name);
            const isNormalFormat = /^\d{4}-(1|2)\.csv$/.test(name);

            // Asignar el campo del programa según el formato detectado
            if (isGraduadosFormat) {
              setIsGraduadosFormat(true);  // Actualiza el estado de formato
              setIsNormalFormat(false);  // Actualiza el estado de formato
              setParsedProgram(results.data[0]?.nombre_programa || '');  // Usar 'nombre_programa' para graduados
            } else if (isNormalFormat) {
              setIsNormalFormat(true);  // Actualiza el estado de formato
              setIsGraduadosFormat(false);  // Actualiza el estado de formato
              setParsedProgram(results.data[0]?.PROG_NOMBRE || '');  // Usar 'PROG_NOMBRE' para normal
            } else {
              setParsedProgram('');  // En caso de que no coincida con ninguno
            }

          },
          error: (error) => {
            showMessage({
              message: "Error",
              description: "Error al cargar el CSV. Por favor, revisa tu conexión e inténtalo de nuevo.",
              type: "danger",
              icon: "danger",
              position: "top",
              duration: 3000,
            });
          },
        });
      } else {
        showMessage({
          message: "Advertencia",
          description: "Se canceló la selección del archivo.",
          type: "warning",
          icon: "warning",
          position: "top",
          duration: 3000,
        });
      }
    } catch (err) {
      showMessage({
        message: "Error",
        description: "Error al seleccionar el archivo.",
        type: "danger",
        icon: "danger",
        position: "top",
        duration: 3000,
      });
    }
  };

    const toggleModal = () => {
      setModalVisible(false);  // Cerrar modal al confirmar
    };
    const mostrarModal = () => {
      setModalVisible(true);  // abrir modal al confirmar
    };

    const confirmUpload = async () => {
      setModalVisible(false);  // Cerrar modal al confirmar
      // Aquí llamamos a la función de upload
      upload();
    };

  const upload = async () => {
    if (csvData && csvData.length > 0) {

     // Mensaje de error si el formato del archivo no es válido
      if (!isNormalFormat && !isGraduadosFormat) {
        showMessage({
          message: "Error",
          description: "El nombre del archivo debe seguir el formato 'año-período.csv' o 'graduados_año-período.csv'.",
          type: "danger",
          icon: "danger",
          position: "top",
          duration: 8000,
        });
        return;
      }

      let endpoint = isNormalFormat ? `${API_BASE_URL}/api/cargageneral` : `${API_BASE_URL}/api/cargagraduados`;


        // Crear el objeto que vamos a enviar en el body
        let dataToSend = isNormalFormat 
        ? { csvData, selectedOption } // Enviar ambos csvData y selectedOption si es formato normal
        : csvData; // Solo enviar csvData si es formato de graduados

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend),
        });
        const result = await response.json();
        if (result.success) {
          showMessage({
            message: "Carga exitosa",
            description: `Se cargaron y/o actualizaron ${csvData.length - 1} registros con éxito.`,
            type: "success",
            icon: "success",
            position: "top",
            duration: 3000,
          });
        } else {
          showMessage({
            message: "Error en la carga",
            description: "Hubo un error al cargar el archivo CSV.",
            type: "danger",
            icon: "danger",
            position: "top",
            duration: 3000,
          });
        }
      } catch (error) {
        showMessage({
          message: "Error en el servidor",
          description: "Error al enviar los datos al servidor.",
          type: "danger",
          icon: "danger",
          position: "top",
          duration: 3000,
        });
      }
    } else {
      showMessage({
        message: "Archivo o tipo de programa no seleccionado",
        description: "Primero debes seleccionar un archivo CSV y el tipo de programa antes de proceder con la carga.",
        type: "danger",
        icon: "danger",
        position: "top",
        duration: 3000,
      });
    }
  };

  const  checkboxChange = (value) => {
    setSelectedOption(value); // Actualizar estado de checkbox
  };
  return (
    <ImageBackground source={require('../assets/fondoinicio.jpg')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <Text style={styles.title}>Carga de datos</Text>
        <Text style={styles.subtitle}>Por favor, cargue el archivo CSV con los datos correctos y en el formato adecuado.</Text>

        <TouchableOpacity style={styles.button} onPress={pickDocument}>
              <FontAwesome5 name="cloud-upload-alt" size={55} color="#132F20" />
              <Text style={styles.buttonText}>
                {fileName ? 'Seleccionar otro archivo' : 'Seleccionar archivo'}
              </Text>

              {fileName && ( <View style={styles.separator} /> )}

              {fileName && (       
              <View style={styles.fileContainer}>   
                <FontAwesome5 name="file-csv" size={24} color="#132F20" />
                <Text style={styles.fileName}>{fileName}</Text>
              </View>          
            )}
        </TouchableOpacity>

       {/* Checkboxes usando react-native-elements */}
        {fileName && isNormalFormat && (
          <View style={styles.checkboxContainer}>
            <Text style={styles.subtitlecheck}>
              Selecciona el tipo de programa al que pertenece la carrera de {capitalizeFirstLetter(parsedProgram)}.
            </Text>
            {options.map((option) => (
              <CheckBox
                key={option.value}
                title={option.label}   
                checkedColor="#C3D730"              
                checked={selectedOption === option.value} // Selecciona solo uno a la vez
                onPress={() => checkboxChange(option.value)}
                textStyle={{ 
                  fontSize: 16,  // Tamaño de fuente
                  color: '#132F20',  // Color de texto
                  fontFamily: 'Montserrat-Bold',  // Tipo de letra
                }}
                containerStyle={{
                  backgroundColor: 'transparent',  // Sin fondo
                  margin: -5,
                }}
              />
            ))}
          </View>
        )}

              
        {fileName && (selectedOption || isGraduadosFormat) && (
          <TouchableOpacity style={styles.button1} onPress={mostrarModal}>
            <Text style={styles.buttonText1}>Cargar archivo</Text>
          </TouchableOpacity>
        )}


        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={toggleModal} // Maneja el cierre desde el hardware
        >
          <View style={styles.modalContent}>
          <FontAwesome5 name="exclamation-circle" size={100} color="#6D100A" />
            <Text style={styles.modalText}>
              {isGraduadosFormat
                ? `Estás subiendo un archivo de graduados del programa ${capitalizeFirstLetter(parsedProgram)}.`
                : `Estás a punto de cargar un archivo de matrícula del programa ${capitalizeFirstLetter(parsedProgram)} de tipo ${selectedOption}.`}
            </Text>
            <TouchableOpacity style={styles.button1} onPress={confirmUpload}>
              <Text style={styles.buttonText1}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonCancel} onPress={toggleModal}>
              <Text style={styles.buttonTextCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};
const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
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
    marginBottom: 20,
  },
  subtitlecheck: {
    fontSize: '16%',
    fontFamily: 'Montserrat-Medium',
    textAlign:'center',
    marginBottom:10,
    color: '#132F20',
  },
  button: {
    backgroundColor: '#F0FFF2',
    padding: 18,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    borderRadius: 20,
    justifyContent: "center"
  },
  buttonText: {
    color: '#132F20',
    fontSize: 17,
    textAlign: "center",
    fontFamily: 'Montserrat-Bold',
  },
  button1: {
    backgroundColor: 'white',
    padding: 5,
    marginBottom: 20,
    marginTop: 15,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#132F20',
    justifyContent: "center"
  },
  buttonText1: {
    color: '#132F20',
    fontSize: 20,
    textAlign: "center",
    fontFamily: 'Montserrat-Bold',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    marginLeft: 10,
    fontSize: 20,
    fontFamily: 'Montserrat-Medium'
  },
  separator: {
    height: 2,
    width: '60%',
    backgroundColor: '#C3D730',
    marginVertical: 10,
  },
  checkboxContainer: {
    width: '100%',
    padding:15,
    backgroundColor:'white', 
    borderRadius:30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
  },
  modalContent: {
    flex:1,
    backgroundColor: 'white',
    padding: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalText: {
    fontSize: 20,
    fontFamily: 'Montserrat-Medium',
    color: '#132F20',
    marginBottom: 10,
    marginTop:10,
    textAlign:'center'
  },
  buttonCancel: {
    backgroundColor: '#6D100A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    position: 'absolute',  // Lo posicionamos de forma absoluta
    bottom: 30,  // Se asegura de que esté al final del modal
    alignSelf: 'center',  // Centra el botón horizontalmente
  },
  buttonTextCancel: {
    color: 'white',
    fontFamily: 'Montserrat-Bold',
  },
});


export default CargarCSV;
