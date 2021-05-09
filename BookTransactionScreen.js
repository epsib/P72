import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet, KeyboardAvoidingView, ToastAndroid, Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config';


export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        scannedStudentId:'',
        buttonState: 'normal',
        transactionMessage: ''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state

      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }
      
    }
    handleTransactions=async()=>{
        var transactiontype = await this.checkBookEligibility();
        if (transactiontype===false){
          Alert.alert("Book does not exist in the database");
          this.setState({
            scannedBookId: '',
            scannedStudentId: ''
          })
        }
        else if(transactiontype==="Issue"){
          var iseligible= await this.checkBookIssue();
          if(iseligible){
            this.issueBook();
            Alert.alert("Book issued successfully");           
          } 
           
        } 
        else{
          var iseligible = await this.checkBookReturn();
          if (iseligible){
            this.returnBook();
            Alert.alert("Book returned successfully")
          }
        }
    }

    checkBookEligibility=async()=>{
      var bookref = db.collection("Books").where("bookID", "==", this.state.scannedBookId).get();
      var transactiontype= ""
      if (bookref.docs.length===0){
          transactiontype = false;
      }
      else{
        bookref.docs.map((doc)=>{
           var store = doc.data();
           if (store.bookAvailability){
             transactiontype="Issue"
           } else if (!store.bookAvailability){
             transactiontype="Return";
           }

        })
      }
      return transactiontype;
    }
     
    checkBookIssue=async()=>{
      var issueref = db.collection("Students").where("studentID", "==", this.state.scannedStudentId).get();
      var iseligible="";
      if(issueref.docs.length===0){
        iseligible=false
        Alert.alert("Student doesn't exist in database");
        this.setState({
          scannedStudentId:'',
          scannedBookId:''
        })
      } 
      else{
         issueref.docs.map((doc)=>{
           var store = doc.data();
           if (store.numberBooksIssued<=2){
             iseligible=true
           }
           else{
             iseligible=false;
             Alert.alert("Student has more than 2 books checked out and cannot check out anymore books");
             this.setState({
               scannedBookId: '' ,
               scannedStudentId: ''
             })
           }
         })
      }
      return iseligible
    }

    checkBookReturn=async()=>{
      var returnref = db.collection("Transactions").where("bookID", "==", this.state.scannedBookId).get();
      var iseligible =""
      returnref.docs.map((doc)=>{
        var store  = doc.data();
        if (store.studentID===this.state.scannedStudentId){
          iseligible=true
        } else{
          iseligible = false;
          Alert.alert("The person returning is different from the person that issued it");
          this.setState({
            scannedBookId:'',
            scannedStudentId:''
          })
        }
      })
      return iseligible
    }
    issueBook = async()=>{
      db.collection("Transactions").add({
         'studentID': this.state.scannedStudentId,
         'bookID': this.state.scannedBookId,
         'date': firebase.firestore.Timestamp.now().toDate(),
         'transactionType': "issue"
      });
      db.collection("Books").doc(this.state.scannedBookId).update({
          'bookAvailability': false,
      })
      db.collection("Students").doc(this.state.scannedStudentId).update({
        'numberBooksIssued': firebase.firestore.FieldValue.increment(1)
    })
    
    this.setState({
      scannedBookId:'',
      scannedStudentId: ''
    })
    }

    returnBook = async()=>{
      db.collection("Transactions").add({
         'studentID': this.state.scannedStudentId,
         'bookID': this.state.scannedBookId,
         'date': firebase.firestore.Timestamp.now().toDate(),
         'transactionType': "return"
      });
      db.collection("Books").doc(this.state.scannedBookId).update({
          'bookAvailability': true,
      })
      db.collection("Students").doc(this.state.scannedStudentId).update({
        'numberBooksIssued': firebase.firestore.FieldValue.increment(-1)
    })
    Alert.alert("Book Returned");
    this.setState({
      scannedBookId:'',
      scannedStudentId: ''
    })

    }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <KeyboardAvoidingView style = {styles.container} behaviour="padding" enabled>
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              onChangeText={text=>this.setState({scannedBookId:text})}
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              onChangeText={text=>this.setState({scannedStudentId: text})}
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.submitButton} onPress={async()=>{ var transactionMessage = await this.handleTransactions()}}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
            </KeyboardAvoidingView>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0
    },
    submitButton:{
      backgroundColor: 'blue',
      width:100,
      height:50
    },
    submitText:{
      padding:10,
      textAlign: 'center',
      fontSize:20,
      fontWeight: 'bold',
      color: 'white'
    }
  });