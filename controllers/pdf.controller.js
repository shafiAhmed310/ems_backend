const pdfreader = require("pdfreader");
const firebase = require("../db");
const moment = require("moment");
const fs = require('fs');
const {spawn} = require('child_process');
const { resolve } = require("path");


var rows = {}; // indexed by y-position
let arr = [];

async function filesPrint(filesUploaded) {
  return new Promise((resolve, reject) => {
    new pdfreader.PdfReader().parseFileItems(
      `uploads/${filesUploaded}`,
      function (err, item) {
      if (!item || item.page) {
          Object.keys(rows)
            .sort((y1, y2) => parseFloat(y1) - parseFloat(y2))
            .forEach((y) => {
              resolve((obj = Object.assign({}, rows[y])), arr.push(obj));
            });
            reject(arr.length<=0);
          rows = {};
        } else if (item.text) {
          (rows[item.y] = rows[item.y] || []).push(item.text);
        }
      }
    )
  });
}
function runChildProcess(filesUploaded){
  return new Promise((resolve,reject)=>{
    var pythoncapitalfinder =  spawn('python', ['pdf-reader.py',filesUploaded]);
      
      pythoncapitalfinder.stdout.on('data',  function (data) {

       });

        pythoncapitalfinder.on('close', (code) => {
          resolve()
       console.log(`child process close all stdio with code ${code}`);
       });

       pythoncapitalfinder.on('error',(err)=>{
         reject(err)
       })
  })
}
const getPdf = async (req, res, next) => {
  try {
    const pdfCollection = await firebase.db.collection("pdf");
    const data = await pdfCollection.get();
    const list = data.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let sortList = list.sort((a, b) => {
      return b.Pdf.StaticData.sortDate.seconds - a.Pdf.StaticData.sortDate.seconds
    })
    if (sortList.length > 0) {
      res.json({
        error: false,
        message: "get all pdf successfully",
        response: sortList,
      });
    } else {
      res.json({ error: true, message: "No pdf found" });
    }
  } catch (error) {
    next(error.message);
  }
};

const getPdfWIthID = async (req, res, next) => {
  let pdfId = req.params.id;
  try {
    const pdfCollection = await firebase.db.collection("pdf").doc(pdfId);
    const data = await pdfCollection.get();
    const responseData = data.data();
    if (responseData !== undefined) {
      res.json({
        error: false,
        message: "get all pdf successfully",
        response: data.data(),
      });
    } else {
      res.json({ error: true, message: "No pdf found" });
    }
  } catch (error) {
    next(error.message);
  }
};
const getPdfWIthMonth = async (req, res, next) => {
  let UploadedMonth = req.params.month;
  try {
    const pdfCollection = await firebase.db.collection("pdf");
    const data = await pdfCollection.get();
    const list = data.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    let pdfData = [];

    list.forEach((element) => {
      if (element.Pdf.StaticData.UploadedMonth === UploadedMonth) {
        pdfData.push(element);
      }
    });
    if (pdfData.length > 0) {
      res.json({
        error: false,
        message: "Pdf get successfully",
        response: pdfData,
      });
    } else {
      res.json({ error: true, message: "No pdf found" });
    }
  } catch (error) {
    next(error.message);
  }
};

const addPdf = async (req, res, next) => {

  try {
    const file = req.file;
    filesUploaded = file.filename;
   let UploadedDateTime = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
    const day = new Date().getDate()
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const fullDate = month + "/" + day + "/" + year
    const demo = new Date(fullDate)
    const pdfCollection = await firebase.db.collection("pdf");
   
    try{
      await   filesPrint(filesUploaded)
    }catch(err){
      console.log(err);
    }
    if(arr.length<=0){
      await runChildProcess(filesUploaded);
      let pdfs=[]; 
      let pdf = JSON.parse(fs.readFileSync('./pdf.json','utf-8')) ;
         let pdfObj=Object.values(pdf);
         for(let i=0; i<pdfObj.length; i++){
           var values1=Object.values(pdfObj[i]);
                pdfs.push(values1)
             }
  let ispdfType = pdfs.flat();
   if(ispdfType.includes("www.servus.ca/mastercard")){
 
     customerName=[]
   const newArrayOfObj1 = pdfObj.map(
     ({
       0: transDate,
       1: postDate,
       2: description,
       3: spendCategories,
       4: amount,
       5: val1,
       6: val2,
       7: val3,
       8: val4,
       isEditable = false,
     }) => ({
       transDate,
       postDate,
       description,
       spendCategories,
       amount,
       val1,
       val2,
       val3,
       val4,
       isEditable,
     })
   );
   for (let i = 0; i < newArrayOfObj1.length; i++) {
        if (newArrayOfObj1[i].transDate==="BL"){
         customerName.push(newArrayOfObj1[i+1].transDate+newArrayOfObj1[i+1].postDate+newArrayOfObj1[i+1].description)
        }
   }
   let acountnm = customerName.toString()
   let staticData = {
     StatementType: "ACCOUNT STATEMENT",
     FinancialInstitution: "SERVUS CREDIT UNION",
     UploadedDateTime: UploadedDateTime,
     CustomerName: acountnm,
     BusinessType: "--",
     ExpenseType: "",
     UploadedMonth: moment().format("MMMM"),
     Date: demo.getTime(),
     sortDate: new Date()
   };
   
   for (let i = 0; i < newArrayOfObj1.length; i++) {
 if (newArrayOfObj1[i].postDate === "Only") {
   var final = newArrayOfObj1.slice(i+1,newArrayOfObj1.length)
 }
   }
   for (let i = 0; i < final.length; i++) {
     if (final[i].description === "Calculation/Plan") {
       final.splice(i, final.length);
     }
   }
   
   final.forEach((ele,i)=>{
   if (ele.val4.startsWith('$')) {
   ele.description = ele.description+ele.spendCategories+" "+ele.amount+" "+ele.val1+" "+ele.val2+" "+ele.val3;
   ele.amount = ele.val4
   ele.spendCategories=""
   ele.val1="",
   ele.val2="",
   ele.val3="",
   ele.val4=""
   }else if (ele.val3.startsWith('$')) {
     ele.description = ele.description+" "+ele.spendCategories+" "+ele.amount+" "+ele.val1+" "+ele.val2
     ele.amount = ele.val3
     ele.spendCategories=""
     ele.val1="",
     ele.val2="",
     ele.val3="",
     ele.val4=""
     }else if (ele.val2.startsWith('$')) {
       ele.description = ele.description+" "+ele.spendCategories+" "+ele.amount+" "+ele.val1
       ele.amount = ele.val2
       ele.spendCategories=""
       ele.val1="",
       ele.val2="",
       ele.val3="",
       ele.val4=""
       }else if (ele.val1.startsWith('$')) {
         ele.description = ele.description+" "+ele.spendCategories+" "+ele.amount
         ele.amount = ele.val1
         ele.spendCategories=""
         ele.val1="",
         ele.val2="",
         ele.val3="",
         ele.val4=""
         }else if (ele.spendCategories !== ""){
         ele.description = ele.description +" " + ele.spendCategories
         ele.spendCategories=""
       }else if(ele.description===""&&ele.spendCategories===""){ 
         ele.transDate = ele.transDate +ele.postDate
         ele.postDate=""
       }
       if (ele.postDate==="####") {
         ele.postDate = ele.transDate+ele.postDate+ele.description
         ele.transDate=""
         ele.description=""
       }
        if(!ele.amount.startsWith("$") && ele.transDate!=="" && ele.postDate!==""){
         ele.description = ele.transDate+" "+ele.postDate+" "+ele.description+" "+ele.amount
         ele.transDate="",
         ele.postDate="",
         ele.spendCategories="",
         ele.amount=""
       } 
 })
 for (let i = 1; i < final.length; i++) {
   if (final[i-1].transDate !=="" && final[i].transDate ==="" && final[i].amount==="" && final[i+1].transDate!=='') {
         final[i-1].description= final[i-1].description+ final[i].description
   }
   if(final[i].postDate.startsWith('#')){
     final[i-1].postDate=final[i].postDate
   }
   if (final[i].postDate==="-") {
     final[i].transDate=""
     final[i].postDate=""
   }
 }
 let servus_mc = final.filter((ele)=>{
   return ele.transDate !=="" && ele.postDate!==""
 })
 const servusMcObject = {
   Pdf: {
     StaticData: staticData,
     TableData: servus_mc,
   },
 };
  pdfCollection.doc().set(servusMcObject);
  if (fs.existsSync(`./uploads/${filesUploaded}`)) {
    fs.unlinkSync(`./uploads/${filesUploaded}`)
   }
 res.json({
   error: false,
   message: "PDF uploaded successfully",
   response: servusMcObject
 });
//ServusMc ends here....
   }else if(ispdfType.includes("www.bmo.com")){
     customerName=[]
     const newArrayOfObj1 = pdfObj.map(
       ({
         0: Date,
         1: Description,
         2: Withdrawals,
         3: Deposits,
         4: Balance,
         5: val1,
         6: val2,
         7: val3,
         8: val4,
         9: val5,
         10:val6,
         isEditable = false,
         
        }) => ({
          Date,
          Description,
          Withdrawals,
          Deposits,
          Balance,
          val1,
          val2,
          val3,
          val4,
          val5,
          val6,
          isEditable
        })
        );
        for (let i = 0; i < newArrayOfObj1.length; i++) {
          if (newArrayOfObj1[i].Date==="Transit") {
            customerName=newArrayOfObj1[i+1].Date+newArrayOfObj1[i+1].Description+newArrayOfObj1[i+1].Withdrawals
          }
     }
      let acountnm = customerName.toString()
        let staticData = {
          StatementType: "FINANCE STATEMENT",
          FinancialInstitution: "BANK OF MONTREAL",
          UploadedDateTime: UploadedDateTime,
          CustomerName: acountnm,
          BusinessType: "--",
          ExpenseType: "",
          UploadedMonth: moment().format("MMMM"),
          Date: demo.getTime(),
          sortDate: new Date()
        };

    for (let i = 0; i < newArrayOfObj1.length; i++) {
      if (newArrayOfObj1[i].Date === "Summary") {
        var bmo = newArrayOfObj1.slice(i+9,newArrayOfObj1.length)
      }
        }
        for (let i = 0; i < bmo.length; i++) {
          if (bmo[i].Withdrawals === "Closing" && bmo[i].Deposits==="totals") {
            bmo.splice(i+1, bmo.length);
          }
        }
        bmo.forEach((ele, i)=>{
          if (ele.Withdrawals==="#") {
            ele.Date=ele.Date+ele.Description+ele.Withdrawals+ele.Deposits+ele.Balance
          }else if(ele.Balance.startsWith("-")){
               ele.Date=ele.Date+ele.Description
               ele.Description= ele.Withdrawals+" "+ele.Deposits
               ele.Withdrawals=""
               ele.Deposits=""
          }else if (ele.val6.startsWith('-')) {
            ele.Date = ele.Date+ele.Description
            ele.Description =ele.Withdrawals+" "+ ele.Deposits+" "+ ele.Balance+" "+ ele.val1+" "+ele.val2+" "+ ele.val3+" "+ele.val4
            ele.Withdrawals= ele.val5
            ele.Balance=ele.val6
            ele.Deposits=""
            ele.val1=""
            ele.val2=""
            ele.val3=""
            ele.val4=""
            ele.val5=""
            ele.val6=""
          }else if (ele.val5.startsWith('-')) {
            ele.Date = ele.Date+ele.Description
            ele.Description =ele.Withdrawals+" "+ ele.Deposits+" "+ ele.Balance+" "+ ele.val1+" "+ele.val2+" "+ ele.val3
            ele.Withdrawals= ele.val4
            ele.Balance=ele.val5
            ele.Deposits=""
            ele.val1=""
            ele.val2=""
            ele.val3=""
            ele.val4=""
            ele.val5=""
          }else if (ele.val4.startsWith('-')) {
            ele.Date = ele.Date+ele.Description
            ele.Description =ele.Withdrawals+" "+ ele.Deposits+" "+ ele.Balance+" "+ ele.val1+" "+ele.val2
            ele.Withdrawals= ele.val3
            ele.Balance=ele.val4
            ele.Deposits=""
            ele.val1=""
            ele.val2=""
            ele.val3=""
            ele.val4=""
          }else if (ele.val3.startsWith('-')) {
            ele.Date = ele.Date+ele.Description
            ele.Description =ele.Withdrawals+" "+ ele.Deposits+" "+ ele.Balance+" "+ ele.val1
            ele.Withdrawals= ele.val2
            ele.Balance=ele.val3
            ele.Deposits=""
            ele.val1=""
            ele.val2=""
            ele.val3=""
          }else if (ele.val2.startsWith('-')) {
            ele.Date = ele.Date+ele.Description
            ele.Description =ele.Withdrawals+" "+ ele.Deposits+" "+ ele.Balance
            ele.Withdrawals= ele.val1
            ele.Balance=ele.val2
            ele.Deposits=""
            ele.val1=""
            ele.val2=""
            ele.val3=""
          }else if (ele.val1.startsWith('-')) {
            ele.Date = ele.Date+ele.Description
            ele.Description =ele.Withdrawals+" "+ ele.Deposits
            ele.Withdrawals= ele.Balance
            ele.Balance=ele.val1
            ele.Deposits=""
            ele.val1=""
          }else if(ele.Deposits==='totals'){
             ele.Date = ele.Date+ele.Description
            ele.Description =ele.Withdrawals+" "+ ele.Deposits
            ele.Withdrawals= ele.Balance
            ele.Balance=ele.val1
            ele.Deposits=""
            ele.val1=""
          }
          if (ele.Date==="Page"||ele.Date=== "Amounts"||ele.Date==="Date" || ele.Date==="continued"
          ||ele.Date==="Business" ) {
            ele.Date = "undefined"
            ele.Description=""
          }
          if (ele.Date!=="" && ele.Description!=="" && ele.Withdrawals==="" && ele.Balance==="") {
            ele.Date=ele.Date+ele.Description
            ele.Description=""
          }
          if (ele.Balance==="" && ele.Date!=="" && ele.Description!=="" && ele.Withdrawals!=="") {
            ele.Date="undefined"
          }
        })

        let final = bmo.filter((res)=>{
          return res.Date!=="undefined"
        })
        final.forEach((ele, i)=>{
          if (ele.Date==="Transactiondetails" || ele.Date.startsWith("#")) {
            ele.Date="undefined"
          }
          if (ele.val1!=="") {
            ele.Date="undefined"
          }
        })
        let finalArr = final.filter((res)=>{
          return (res.Date!=="undefined" )
        })
        for (let i = 0; i < finalArr.length; i++) {
          if (finalArr[i].Date!=="" && finalArr[i].Description==="" && finalArr[i].Withdrawals==="") {
            finalArr[i-1].Description = finalArr[i-1].Description + finalArr[i].Date
             finalArr.splice(i,1)
          }else if (finalArr[i].Withdrawals==="#") {
              finalArr[i].Description=""
              finalArr[i].Withdrawals=""
              finalArr[i].Deposits=""
              finalArr[i].Balance=""
            }
            if(finalArr[i].Balance.startsWith("-")){
              let resultBalance = finalArr[i].Balance.replace("-", "");
              finalArr[i].Balance = resultBalance;
            }
        }
            
        for (let i = 1; i < finalArr.length; i++) {
          if ((Number(finalArr[i].Balance.replace(/[^0-9.-]+/g,""))   > Number(finalArr[i-1].Balance.replace(/[^0-9.-]+/g,"")))) {
            finalArr[i].Deposits = "";
    
          }else if (Number(finalArr[i].Balance.replace(/[^0-9.-]+/g,""))   < Number(finalArr[i-1].Balance.replace(/[^0-9.-]+/g,""))) {
            finalArr[i].Deposits = finalArr[i].Withdrawals;
            finalArr[i].Withdrawals = "";
          }

        }
        const bmoObject = {
          Pdf: {
            StaticData: staticData,
            TableData: finalArr,
          },
        };
        pdfCollection.doc().set(bmoObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
         }
        res.json({
          error: false,
          message: "PDF uploaded successfully",
          response: bmoObject
        });
        //BMO end here...
   }else if (ispdfType.includes("www.atb.com")) {
    const newArrayOfObj1 = pdfObj.map(
      ({
        0: Date,
        1: Description,
        2: Withdrawals,
        3: Deposits,
        4: Balance,
        5: val1,
        6: val2,
        7: val3,
        8: val4,
        9: val5,
        10: val6,
        11: val7,
       isEditable = false,
      }) => ({
        Date,
        Description,
        Withdrawals,
        Deposits,
        Balance,
        val1,
        val2,
        val3,
        val4,
        val5,
        val6,
        val7,
        isEditable,
      })
    );
    for (let i = 1; i < newArrayOfObj1.length; i++) {
      if (newArrayOfObj1[i].Date.startsWith("ATB0114001")) {
        var customerATB =
          newArrayOfObj1[i + 1].Date +
          " " +
          newArrayOfObj1[i + 1].Description +
          " " +
          newArrayOfObj1[i + 1].Withdrawals +
          "" +
          newArrayOfObj1[i + 1].Deposits;
      }
      if (
        newArrayOfObj1[i].Date === "Customer" &&
        newArrayOfObj1[i].Description === "number"
      ) {
        var customerATBno = newArrayOfObj1[i].Withdrawals;
      }
    }
    let staticData = {
      StatementType: "FINANCE STATEMENT",
      FinancialInstitution: "ATB",
      UploadedDateTime: UploadedDateTime,
      UploadedMonth: moment().format("MMMM"),
      Date: demo.getTime(),
      CustomerName: customerATB,
      CustomerNo: customerATBno,
      StatementDate: "31/01/2020",
      BusinessType: "--",
      ExpenseType: "",
      sortDate: new Date(),
    };
    for (let i = 0; i < newArrayOfObj1.length; i++) {
      if (newArrayOfObj1[i].val3 === "=") {
        var ATB = newArrayOfObj1.slice(i + 1, newArrayOfObj1.length);
      }
    }
    for (let i = 0; i < ATB.length; i++) {
      if (ATB[i].Date === "Date") {
        ATB.splice(i, 1);
      }
    }
    ATB.forEach((ele, i) => {
      if (ATB[i].Date === "AConsolidated") {
        ATB.splice(i, 7);
      }
      if (ATB[i].Date === "ADetails") {
        ATB.splice(i, 2);
      }
      if (ATB[i].Description === "summary") {
        ATB.splice(i, 4);
      }
      if (ATB[i].Date === "Debits") {
        ATB.splice(i, 1);
      }
      if (ATB[i].Date === "Flex" && ATB[i].Description === "Fit") {
        ATB.splice(i, newArrayOfObj1.length);
      }
    });
    
    ATB.forEach((ele, i) => {
      if (ATB[i].Date.length < 3 || ATB[i].Date === "RI-") {
        ATB[i].Date = ATB[i].Description;
        ATB[i].Description = ATB[i].Withdrawals;
        ATB[i].Withdrawals = ATB[i].Deposits;
        ATB[i].Deposits = ATB[i].Balance;
        ATB[i].Balance = ATB[i].val1;
        ATB[i].val1 = ATB[i].val2;
        ATB[i].val2 = ATB[i].val3;
        ATB[i].val3 = ATB[i].val4;
        ATB[i].val4 = ATB[i].val5;
        ATB[i].val5 = ATB[i].val6;
        ATB[i].val6 = ATB[i].val7;
      }

      if (ATB[i].val1 === "" && ATB[i].Date.length > 2) {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals + " " + ATB[i].Deposits + " ";
        ATB[i].Withdrawals = ATB[i].Balance;
        ATB[i].Deposits = ATB[i].val1;
        ATB[i].Balance = "";
        ATB[i].val1 = "";
      }
      if (
        ATB[i].val7 === "" &&
        ATB[i].val1 != "" &&
        ATB[i].val2 != "" &&
        ATB[i].val3 != "" &&
        ATB[i].val4 != "" &&
        ATB[i].val5 != "" &&
        ATB[i].val6 != "" &&
        ATB[i].Date.length > 2
      ) {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals +
          " " +
          ATB[i].Deposits +
          " " +
          ATB[i].Balance +
          " " +
          ATB[i].val1 +
          " " +
          ATB[i].val2 +
          " " +
          ATB[i].val3 +
          "" +
          ATB[i].val4;
        ATB[i].Withdrawals = ATB[i].val5;
        ATB[i].Deposits = ATB[i].val6;
        ATB[i].Balance = "";
        ATB[i].val1 = "";
        ATB[i].val2 = "";
        ATB[i].val3 = "";
        ATB[i].val4 = "";
        ATB[i].val5 = "";
        ATB[i].val6 = "";
      }
      if (
        ATB[i].val6 === "" &&
        ATB[i].val1 != "" &&
        ATB[i].val2 != "" &&
        ATB[i].val3 != "" &&
        ATB[i].val4 != "" &&
        ATB[i].val5 != "" &&
        ATB[i].Date.length > 2
      ) {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals +
          " " +
          ATB[i].Deposits +
          " " +
          ATB[i].Balance +
          " " +
          ATB[i].val1 +
          " " +
          ATB[i].val2 +
          " " +
          ATB[i].val3;
        ATB[i].Withdrawals = ATB[i].val4;
        ATB[i].Deposits = ATB[i].val5;
        ATB[i].Balance = "";
        ATB[i].val1 = "";
        ATB[i].val2 = "";
        ATB[i].val3 = "";
        ATB[i].val4 = "";
        ATB[i].val5 = "";
      }
      if (
        ATB[i].val5 === "" &&
        ATB[i].val1 != "" &&
        ATB[i].val2 != "" &&
        ATB[i].val3 != "" &&
        ATB[i].val4 != "" &&
        ATB[i].Date.length > 2
      ) {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals +
          " " +
          ATB[i].Deposits +
          " " +
          ATB[i].Balance +
          " " +
          ATB[i].val1 +
          " " +
          ATB[i].val2;
        ATB[i].Withdrawals = ATB[i].val3;
        ATB[i].Deposits = ATB[i].val4;
        ATB[i].Balance = "";
        ATB[i].val1 = "";
        ATB[i].val2 = "";
        ATB[i].val3 = "";
        ATB[i].val4 = "";
      }
      if (
        ATB[i].val4 === "" &&
        ATB[i].val1 != "" &&
        ATB[i].val2 != "" &&
        ATB[i].val3 != ""
      ) {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals +
          " " +
          ATB[i].Deposits +
          " " +
          ATB[i].Balance +
          ATB[i].val1;
        ATB[i].Withdrawals = ATB[i].val2;
        ATB[i].Deposits = ATB[i].val3;
        ATB[i].Balance = "";
        ATB[i].val1 = "";
        ATB[i].val2 = "";
        ATB[i].val3 = "";
      }
      if (
        ATB[i].val3 === "" &&
        ATB[i].val1 != "" &&
        ATB[i].val2 != "" &&
        ATB[i].Date.length > 2
      ) {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals +
          " " +
          ATB[i].Deposits +
          " " +
          ATB[i].Balance;
        ATB[i].Withdrawals = ATB[i].val1;
        ATB[i].Deposits = ATB[i].val2;
        ATB[i].Balance = "";
        ATB[i].val1 = "";
        ATB[i].val2 = "";
      }
      if (
        ATB[i].val2 === "" &&
        ATB[i].val1 != "" &&
        ATB[i].Date.length > 2
      ) {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals + " " + ATB[i].Deposits + " ";
        ATB[i].Withdrawals = ATB[i].Balance;
        ATB[i].Deposits = ATB[i].val1;
        ATB[i].Balance = "";
        ATB[i].val1 = "";
      }
      if (ATB[i].val7!=="") {
        ATB[i].Date = ATB[i].Date + " " + ATB[i].Description;
        ATB[i].Description =
          ATB[i].Withdrawals +
          " " +
          ATB[i].Deposits +
          " " +
          ATB[i].Balance +
          " " +
          ATB[i].val1 +
          " " +
          ATB[i].val2 +
          " " +
          ATB[i].val3 +
          " " +
          ATB[i].val4;
          +
          " "+
          ATB[i].val5
        ATB[i].Withdrawals = ATB[i].val6;
        ATB[i].Deposits = ATB[i].val7;
        ATB[i].Balance = ""
        ATB[i].val1 = "";
        ATB[i].val2 = "";
        ATB[i].val3 = "";
        ATB[i].val4 = "";
        ATB[i].val5 = "";
        ATB[i].val6 = "";
        ATB[i].val7="";
      }
     

      if (ATB[i].Deposits === "" && ATB[i].Balance === "") {
        ATB[i].Balance = ATB[i].Withdrawals;
        ATB[i].Withdrawals = "";
      } else {
        ATB[i].Balance = ATB[i].Deposits;
        ATB[i].Deposits = "";
      }
      if (ATB[i].Date === "Details of") {
        ATB[i].Date =
          ATB[i].Date +
          ATB[i].Description +
          "" +
          ATB[i].Withdrawals +
          "" +
          ATB[i].Deposits +
          "" +
          ATB[i].Balance;
        ATB[i].Withdrawals = "";
        ATB[i].Deposits = "";
        ATB[i].Balance = "";
        ATB[i].Description = "";
      }
      if (ATB[i].Description.startsWith("YEAR")) {
        ATB[i].Date =
          ATB[i].Date +
          "" +
          ATB[i].Description +
          "" +
          ATB[i].Withdrawals +
          "" +
          ATB[i].Deposits;
        ATB[i].Withdrawals = "";
        ATB[i].Deposits = "";
        ATB[i].Description = "";
      }
      
    });
    
    for (let i = 1; i < ATB.length; i++) {
      
      if (ATB[i].Description.startsWith("*")) {
        ATB[i - 1].Description =
          ATB[i - 1].Description + ATB[i].Date + ATB[i].Description;
        ATB.splice(i, 1);
      }
      if (
        Number(ATB[i].Balance.replace(/[^0-9.-]+/g, "")) >
        Number(ATB[i - 1].Balance.replace(/[^0-9.-]+/g, ""))
      ) {
        ATB[i].Deposits = ATB[i].Withdrawals;
        ATB[i].Withdrawals = "";
      } else if (
        Number(ATB[i].Balance.replace(/[^0-9.-]+/g, "")) <
        Number(ATB[i - 1].Balance.replace(/[^0-9.-]+/g, ""))
      ) {
        ATB[i].Deposits = "";
      }
     
    }
    
    ATB.forEach((ele, i)=>{
      if (
        (ATB[i].Withdrawals === "BALANCE" ||
        ATB[i].Withdrawals === "FORWARD") && ATB[i].Balance.startsWith("$") 
      ) {
       ele.Description=ele.Description+ele.Withdrawals+ele.Deposits+ele.Balance
       ele.Withdrawals=""
       ele.Deposits=""
       ele.Balance=""
      }
    })
    ATB.forEach((ele, i) => {
      if (ele.Balance === "a") {
        ATB.splice(i, ATB.length);
      }
      if (ele.Date === "Statement date") {
        ATB.splice(i, 2);
      }
      if (ele.val7 !== "") {
        ele.val7 = "";
      }
      
    });
    for(let i = 0; i < ATB.length; i++){
      if(ATB[i].Date.includes("Details ofLoan Account")){
      ATB.splice(i,ATB.length)
    }
  }
    const AtbObject = {
      Pdf: {
        StaticData: staticData,
        TableData: ATB,
      },
    };
    pdfCollection.doc().set(AtbObject);
    if (fs.existsSync(`./uploads/${filesUploaded}`)) {
      fs.unlinkSync(`./uploads/${filesUploaded}`);
    }
    res.json({
      error: false,
      message: "PDF uploaded successfully",
      response: AtbObject,
    });
    //ATB ends here....
  }
   else{
     res.json({error:true,
     message:"pdf not found"
   })
   }
   }else{
     async function confrim() {
      let selectArr = [];
      for (let i = 0; i < arr.length; i++) {
        let values = Object.values(arr[i]);
        selectArr.push(values);
      }
      let ispdfType = selectArr.flat();
      if (ispdfType.includes("http://www.servus.ca")) {
        customerName=[]
        const newArrayOfObj1 = arr.map(
          ({
            0: Date,
            1: Description,
            2: Withdrawals,
            3: Deposits,
            4: Balance,
            isEditable = false,

          }) => ({
            Date,
            Description,
            Withdrawals,
            Deposits,
            Balance,
            isEditable
          })
          );
          for (var i = 0; i < newArrayOfObj1.length; i++) {
            if (newArrayOfObj1[i].Date.includes("Tel:")) {
              customerName.push(newArrayOfObj1[i+2].Date)
            }
          }
          let acountnm = customerName.toString()
          let staticData = {
            StatementType: "FINANCE STATEMENT",
            FinancialInstitution: "SERVUS CREDIT UNION",
            UploadedDateTime: UploadedDateTime,
            CustomerName: acountnm,
            BusinessType: "--",
            ExpenseType: "",
            UploadedMonth: moment().format("MMMM"),
            Date: demo.getTime(),
            sortDate: new Date()
          };
        // ------------------------------------------------------------------------------------------------
        newArrayOfObj1.forEach((element,i) => {
          if (element.Deposits === undefined && element.Balance === undefined) {
            element.Balance = element.Withdrawals;
            element.Withdrawals = "";
            element.Deposits = "";
          } else if (element.Withdrawals.startsWith("(")) {
            element.Balance = element.Deposits;
            element.Deposits = "";
          } else if (!element.Withdrawals.startsWith("(")) {
            element.Balance = element.Deposits;
            element.Deposits = element.Withdrawals;
            element.Withdrawals = "";
          }
          if (element.Date==="Date") {
           element.Balance=undefined
          }
        });
        let balance = newArrayOfObj1.filter((ele) => {
          return ele.Balance !== undefined;
        });
        for (let i = 0; i < balance.length; i++) {
          if (balance[i].Date === "Total") {
            balance.splice(i, balance.length);
          }
        }
        const servusObject = {
          Pdf: {
            StaticData: staticData,
            TableData: balance,
          },
        };

       await pdfCollection.doc().set(servusObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "PDF uploaded successfully",
          response: servusObject,
        });
        //servus pdf ends here.....
      } 
      else if (ispdfType.includes("Internet: bmo.com/treasuryandpayment")) {

        customerName = []
        accountNumber = []
        let bmo_mc = arr.slice(34, 69);
        const newArrayOfObj1 = bmo_mc.map(
        ({
        0: transDate,
        1: postDate,
        2: description,
        3: preTax,
        4: totalTax,
        5: transAmount,
        6: e,
        isEditable = false,
        }) => ({
        transDate,
        postDate,
        description,
        preTax,
        totalTax,
        transAmount,
        e,
        isEditable,
        })
        );
       
        for (var i = 0; i < newArrayOfObj1.length; i++) {
        if (newArrayOfObj1[i].transDate.includes("Card")) {
        customerName.push(newArrayOfObj1[i].postDate)
        accountNumber.push(newArrayOfObj1[i].transDate)
        }
        }
        let acountname = customerName.toString()
        
        let acountnumber = accountNumber.toString()
        
        let staticData = {
        StatementType: "CREDIT CARD STATEMENT ",
        FinancialInstitution: "BMO FINANCIAL GROUP",
        UploadedDateTime: UploadedDateTime,
        UploadedMonth: moment().format("MMMM"),
        Date: demo.getTime(),
        AccountName: "2231220 ALBERTA INC",
        CardNumber: acountnumber,
        CustomerName: acountname,
        Account_Limit: "$ 10,000.00",
        EmployeeID: "PATELJ",
        Available_Credit: "$ 2,631.87",
        StatementDate: "01/03/2021",
        Currency: "CANADIAN DOLLAR",
        PaymentDueDate: "01/24/2021",
        ExpenseType: "",
        sortDate: new Date()
        };
        newArrayOfObj1.forEach((element, i) => {
          if (element.preTax !== undefined) {
            newArrayOfObj1[i].transId = newArrayOfObj1[i + 1].transDate;
            newArrayOfObj1[i].auth = newArrayOfObj1[i + 1].postDate;

            newArrayOfObj1.splice(i + 1, 1);
          }
          if (element.e !== undefined) {
            newArrayOfObj1[i].totalTax =
              newArrayOfObj1[i].totalTax + "" + newArrayOfObj1[i].transAmount;
            newArrayOfObj1[i].transAmount = newArrayOfObj1[i].e;
            newArrayOfObj1[i].e = "";
          }
          if (element.e === undefined) {
            element.e = "";
          }
          if (element.auth === undefined) {
            element.auth = "";
          }
          if (element.description === undefined) {
            element.description = ""
            element.preTax = "";
            element.totalTax = "";
            element.transAmount = "";
          }
        });
        let balance = newArrayOfObj1.filter((ele) => {
          return ele.postDate !== undefined && ele.transAmount !== undefined;
        });
        balance.forEach((ele) => {
          if(ele.postDate !== undefined && ele.description === "") {
            ele.description = ele.postDate;
            ele.postDate =""
          }
        })
        for (let i = 0; i < balance.length; i++) {
          if (balance[i].transDate === "TOTAL CREDITS") {
            balance.splice(i, balance.length);
          }
        }
        const bmoObject = {
          Pdf: {
            StaticData: staticData,
            TableData: balance,
          },
        };
        await pdfCollection.doc().set(bmoObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "PDF uploaded successfully",
          response: bmoObject,
        });
        // bmo_mc ends here.....
      }
      else if (ispdfType.includes("princegeorge@cwbank.com")) {
        let staticData = {
          StatementType: "FINANCE STATEMENT",
          FinancialInstitution: "CANADIAN WESTERN BANK",
          UploadedDateTime: UploadedDateTime,
          UploadedMonth: moment().format("MMMM"),
          Date: demo.getTime(),
          CustomerName: "PRINCE GEORGE",
          CustomerNo: "64216",
          StatementDate: "31/01/2020",
          Interest: "647.56",
          BusinessType: "--",
          ExpenseType: "",
          sortDate: new Date()
        };

        let CWB = arr.slice(17, 428);
        CWB.splice(148, 10);
        CWB.splice(200, 10);
        CWB.splice(252, 10);
        CWB.splice(285, 17);
        CWB.splice(86, 10);
        CWB.splice(314, 10);
        CWB.splice(316, 24);
        CWB.splice(24, 10);
        CWB.splice(308, 2);
        const newArrayOfObj1 = CWB.map(
          ({
            0: Date,
            1: Description,
            2: Withdrawals,
            3: Deposits,
            4: Balance,
            isEditable = false,
          }) => ({
            Date,
            Description,
            Withdrawals,
            Deposits,
            Balance,
            isEditable,
          })
        );
        newArrayOfObj1.forEach((ele) => {
          if (ele.Deposits === undefined && ele.Balance === undefined) {
            ele.Balance = ele.Withdrawals;
            ele.Withdrawals = "";
            ele.Deposits = "";
          } else if (ele.Withdrawals.endsWith("-")) {
            ele.Balance = ele.Deposits;
            ele.Deposits = "";
          } else if (!ele.Withdrawals.endsWith("-")) {
            ele.Balance = ele.Deposits;
            ele.Deposits = ele.Withdrawals;
            ele.Withdrawals = "";
          }
        });
        newArrayOfObj1.forEach((ele, i) => {
          if (
            ele.Description === "PreAuthorized Debit" ||
            ele.Description === "PreAuthorized Credit" ||
            ele.Description === "Cheque Cleared" ||
            ele.Description === "Coverdraft Transfer In" ||
            ele.Description === "E-Transfer Withdrawal Fee" ||
            ele.Description === "E-Transfer Withdrawal" ||
            ele.Description === "Coverdraft Transfer Out" ||
            ele.Description === "Certified Cheque" ||
            ele.Description === "E-Transfer Deposit"
          ) {
            newArrayOfObj1[i].Description =
              newArrayOfObj1[i].Description + "," + newArrayOfObj1[i + 1].Date;
            newArrayOfObj1.splice(i + 1, 1);
          } else if (
            ele.Description === "Account to LOC sweep" ||
            ele.Description === "Online Bill Payment" ||
            ele.Description === "Bill Payment" ||
            ele.Description === "Debit Arrangement"
          ) {
            newArrayOfObj1[i].Description =
              newArrayOfObj1[i].Description +
              "," +
              newArrayOfObj1[i + 1].Date +
              "," +
              newArrayOfObj1[i + 2].Date;
            newArrayOfObj1.splice(i + 1, 2);
          }
        });
        const cwbObject = {
          Pdf: {
            StaticData: staticData,
            TableData: newArrayOfObj1,
          },
        };

        await pdfCollection.doc().set(cwbObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "PDF uploaded successfully",
          response: cwbObject,
        });
      }
      //cwb ends here....
      else if (ispdfType.includes("Website: cwbank.mycardinfo.com")) {
        let staticData = {
          StatementType: "ACCOUNT STATEMENT",
          FinancialInstitution: "CANADIAN WESTERN BANK",
          UploadedDateTime: UploadedDateTime,
          UploadedMonth: moment().format("MMMM"),
          Date: demo.getTime(),
          AccountNumber: "4084540001007240",
          CustomerName: "COLLABRIA",
          InterestCharged: "0.0",
          AnnualInterestRatePurchasesFees: "19.99%",
          AnnualInterestRateCashAdvances: "21.00%",
          StatementPeriod: " 13/05/2020 - 12/06/2020",
          CreditLimit: "20,000.00",
          AvailableCredit: "6,562.99",
          ExpenseType: "",
          sortDate: new Date()
        };

        let cwb_cc = arr.slice(63, 235);
        cwb_cc.splice(4, 2);
        cwb_cc.splice(83, 6);
        cwb_cc.splice(121, 1);
        cwb_cc.splice(157, 6);
        cwb_cc.splice(16, 1);

        let evenArray = [];
        let oddArray = [];
        for (let i = 0; i < cwb_cc.length; i++) {
          if (i % 2 === 0) {
            evenArray.push(cwb_cc[i]);
          } else {
            oddArray.push(cwb_cc[i]);
          }
        }
        const newArrayOfObj1 = evenArray.map(
          ({
            0: transDate,
            1: description,
            2: referenceNumber,
            3: amount,
            isEditable = false,
          }) => ({
            transDate,
            description,
            referenceNumber,
            amount,
            isEditable,
          })
        );

        const newArrayOfObj2 = oddArray.map(
          ({ 0: postDate, 1: oddreferenceNumber, 2: oddamount }) => ({
            postDate,
            oddreferenceNumber,
            oddamount,
          })
        );

        newArrayOfObj1.unshift("");
        newArrayOfObj2.unshift("");
        newArrayOfObj1.forEach((element) => {
          if (element.amount === undefined) {
            element.amount = element.referenceNumber;
            element.referenceNumber = "";
          }
        });
        let tableData = [];
        for (let i = 0; i <= newArrayOfObj1.length; i++) {
          for (let j = 0; j <= newArrayOfObj2.length; j++) {
            if ((i = j)) {
              let tableObject = {
                ...newArrayOfObj1[i],
                ...newArrayOfObj2[j],
              };
              tableData.push(tableObject);
            }
          }
        }
        tableData.pop();
        tableData.forEach((ele, i) => {
          if (ele.transDate === "PETROCAN-141 CENTURY CROS SPRUCE GROVE") {
            tableData[i].description =
              tableData[i].transDate + " " + tableData[i + 1].postDate;
            tableData[i].referenceNumber = tableData[i].oddreferenceNumber;
            tableData[i].transDate = tableData[i].postDate;
            tableData[i].postDate = tableData[i + 1].transDate;
            tableData[i].oddreferenceNumber = "";
            tableData[i].amount = tableData[i].oddamount;
            tableData[i].oddamount = "";

            tableData.splice(i + 1, 1);
          } else if (ele.postDate.startsWith("I")) {
            const temp = tableData[i].description;
            tableData[i].description = tableData[i].postDate;
            tableData[i].postDate = temp;
          }
          if (
            ele.oddamount === undefined &&
            ele.oddreferenceNumber === undefined
          ) {
            (ele.oddamount = ""), (ele.oddreferenceNumber = "");
          }
        });
        const cwb_ccObject = {
          Pdf: {
            StaticData: staticData,
            TableData: tableData,
          },
        };
        await pdfCollection.doc().set(cwb_ccObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "PDF uploaded successfully",
          response: cwb_ccObject,
        });
        //cwb_cc ends here....
      } else if (ispdfType.includes("CIBC Account Statement")) {
        
        const newArrayOfObj1 = arr.map(
          ({
            0: Date,
            1: Description,
            2: Withdrawals,
            3: Deposits,
            4: Balance,
            isEditable = false,
          }) => ({
            Date,
            Description,
            Withdrawals,
            Deposits,
            Balance,
            isEditable,
          })
        );
        for(let i=0;i<2;i++){
          if(newArrayOfObj1[i].Date.startsWith("CIBC")){
            var customerCibc=newArrayOfObj1[i+1].Date;
            var stmtdate=(newArrayOfObj1[i+1].Description).replace("For","");

          }
        }
        for(let i=0;i<5;i++){
          if(newArrayOfObj1[i].Date.startsWith("Account")){
            var accountno=newArrayOfObj1[i+1].Date;

          }
        }
        let staticData = {
          StatementType: "FINANCE STATEMENT",
          FinancialInstitution: "CIBC",
          AccountNumber: accountno,
          Date: demo.getTime(),
          UploadedMonth: moment().format("MMMM"),
          CustomerName: customerCibc,
          StatementDate: stmtdate,
          BusinessType: "--",
          ExpenseType: "",
          UploadedDateTime: UploadedDateTime,
          sortDate: new Date()
        };
        for (let i = 0; i < newArrayOfObj1.length; i++) {
          if (newArrayOfObj1[i].Date === "Closing balance") {
            var cibc = newArrayOfObj1.slice(29, i + 1);
          }
        }
        cibc.forEach((ele, i) => {
          if (ele.Date === "Closing balance") {
            cibc.slice(29, i);
          }
        });
        cibc.forEach((ele, i) => {
          if (ele.Date === "(continued on next page)") {
            cibc.splice(i, 9);
          }
        });
        cibc.forEach((ele, i) => {
          if (cibc[i].Description === undefined) {
            cibc[i].Description = ele.Date;
            cibc[i].Date = "";
          }
          if (cibc[i].Date.length > 6) {
            cibc[i].Deposits = cibc[i].Withdrawals;
            cibc[i].Withdrawals = cibc[i].Description;
            cibc[i].Description = cibc[i].Date;
            cibc[i].Date = "";
          }
        });
        cibc.forEach((ele, i) => {
          if (cibc[i].Date !== "") {
            if (
              cibc[i + 1].Withdrawals === undefined &&
              cibc[i + 2].Withdrawals === undefined
            ) {
              cibc[i].Description =
                cibc[i].Description +
                " " +
                cibc[i + 1].Description +
                " " +
                cibc[i + 2].Description;
              cibc.splice(i + 1, 2);
            } else if (cibc[i + 1].Withdrawals === undefined) {
              cibc[i].Description =
                cibc[i].Description + " " + cibc[i + 1].Description;
              cibc.splice(i + 1, 1);
            }
          }
        });
        for (let i = 1; i < cibc.length; i++) {
          if (cibc[i].Date === "") {
            if (
              cibc[i].Withdrawals === undefined &&
              cibc[i + 1].Withdrawals === undefined
            ) {
              cibc[i - 1].Description =
                cibc[i - 1].Description +
                " " +
                cibc[i].Description +
                " " +
                cibc[i + 1].Description;
              cibc.splice(i, 2);
            } else if (cibc[i].Withdrawals === undefined) {
              cibc[i - 1].Description =
                cibc[i - 1].Description + " " + cibc[i].Description;
              cibc.splice(i, 1);
            }
          }
        }

        cibc.forEach((ele, i) => {
          if (ele.Deposits === undefined && ele.Balance === undefined) {
            ele.Balance = ele.Withdrawals;
            ele.Withdrawals = "";
            ele.Deposits = "";
          } else {
            (ele.Balance = ele.Deposits), (ele.Deposits = "");
          }
        });
        for (let i = 0; i < cibc.length; i++) {
          if (
            cibc[i].Description === "Balance forward" ||
            cibc[i].Description === "Opening balance" ||
            cibc[i].Description === "Closing balance"
          ) {
            var resultBalance = cibc[i].Balance.replace("$", "");
            cibc[i].Balance = resultBalance;
          }
        }
        for (let i = 1; i < cibc.length; i++) {
          if ((Number(cibc[i].Balance.replace(/[^0-9.-]+/g,""))   > Number(cibc[i-1].Balance.replace(/[^0-9.-]+/g,"")))) {
            cibc[i].Deposits = cibc[i].Withdrawals;
            cibc[i].Withdrawals = "";
    
          }else if (Number(cibc[i].Balance.replace(/[^0-9.-]+/g,""))   < Number(cibc[i-1].Balance.replace(/[^0-9.-]+/g,""))) {
            cibc[i].Deposits = "";
          }

        }

        const cibcObject = {
          Pdf: {
            StaticData: staticData,
            TableData: cibc,
          },
        };
        await pdfCollection.doc().set(cibcObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "file uploaded successfully",
          response: cibcObject,
        });
        //cibc ends here....
      }else if (ispdfType.includes("CIBC bizline Visa")) {
        
        customerName=[]
        accountNumber=[]

        const static = arr.map(
          ({
            0: transDate,
            1: postDate,
          }) => ({
            transDate,
            postDate,
          })
        );
        don=[]
        static.forEach((ele, i) => {
          don.push(ele,i);
        });
        for (var i = 0; i < static.length; i++) {
          if (static[i].transDate==="TM" && static[i].postDate==="TM1") {
            customerName.push(static[i-1].transDate)
          }
          if (static[i].transDate==="TM" && static[i].postDate==="TM1") {
            accountNumber.push(static[i+3].transDate)
          }
        }
        let acountnm = customerName.toString()
        let acountnbr = accountNumber.toString()
        let staticData = {
          StatementType: "ACCOUNT STATEMENT",
          FinancialInstitution: "CIBC",
          UploadedDateTime: UploadedDateTime,
          UploadedMonth: moment().format("MMMM"),
          Date: demo.getTime(),
          AccountNumber: acountnbr,
          CustomerName: acountnm,
          ExpenseType: "",
          sortDate: new Date()
        };

        let cibc_visa = arr.slice(74, 87);
        const newArrayOfObj1 = cibc_visa.map(
          ({
            0: transDate,
            1: postDate,
            2: description,
            3: spendCategories,
            4: amount,
            isEditable = false,
          }) => ({
            transDate,
            postDate,
            description,
            spendCategories,
            amount,
            isEditable,
          })
        );

        newArrayOfObj1.forEach((element) => {
          if (element.amount === undefined) {
            element.amount = element.spendCategories;
            element.spendCategories = " ";
          }
        });
        let amount = newArrayOfObj1.filter((ele) => {
          return ele.amount !== undefined;
        });
        let tableData = amount.filter((ele) => {
          return ele.amount !== "Amount($)";
        });

        for (let i = 0; i < tableData.length; i++) {
          if (tableData[i].Date === "Total") {
            tableData.splice(i, tableData.length);
          }
        }
        const cibcVisaObject = {
          Pdf: {
            StaticData: staticData,
            TableData: tableData,
          },
        };
        await pdfCollection.doc().set(cibcVisaObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "PDF uploaded successfully",
          response: cibcVisaObject,
        });
        //cibcVisa ends here....
      } else if (ispdfType.includes("904 - 91 STREET SW")) {
        customerName=[]
        accountNumber=[]
        const static = arr.map(
          ({
            0: referenceNumber,
            1: transDate,
          }) => ({
            referenceNumber,
            transDate,
          })
        );
        for (var i = 0; i < static.length; i++) {
          if (static[i].referenceNumber==="P") {
            accountNumber.push(static[i+1].transDate)
          }
          if (static[i].referenceNumber==="statement, call us at:") {
            customerName.push(static[i+1].referenceNumber)
          }
        }
        let acountnm = customerName.toString()
        let acountnbr = accountNumber.toString()
        let staticData =
        {
          StatementType: "ACCOUNT STATEMENT",
          FinancialInstitution: "SCOTIA BANK",
          UploadedDateTime: UploadedDateTime,
          UploadedMonth: moment().format('MMMM'),
          AccountNumber: acountnbr,
          CustomerName: acountnm,
          ExpenseType: "",
          Date: demo.getTime(),
          sortDate: new Date()
        }
        let final = arr.slice(54, 1054)
        const newArrayOfObj1 = final.map(
          ({
            0: referenceNumber,
            1: transDate,
            2: postDate,
            3: description,
            4: amount,
            5: description1,
            6: description2,
            isEditable = false,
          }) => ({
            referenceNumber,
            transDate,
            postDate,
            description,
            amount,
            description1,
            description2,
            isEditable,
          })
        );
          
        newArrayOfObj1.forEach((element) => {
          if (element.description1 !== undefined) {
            element.description = element.description+" " + element.amount+" " + element.description1;
            element.amount = element.description2
            element.description1 = ""
            element.description2 = ""
          }
          if (element.transDate === " -") {
            element.transDate = element.referenceNumber + element.transDate + element.postDate + element.description;
            element.referenceNumber = ""
            element.postDate = ""
            element.description = ""
            element.amount = ""
            element.description1 = ""
            element.description2 = ""
          }
          if (element.referenceNumber !== undefined && element.postDate !== undefined && element.amount !== undefined) {
            element.description1 = ""
            element.description2 = ""
          }
          if (element.referenceNumber.startsWith('S') || element.referenceNumber.startsWith('R')) {
            element.description1 = undefined
            element.description2 = undefined
          }
        });


        let balance = newArrayOfObj1.filter((ele) => {
          return ele.description1 !== undefined && ele.description2 !== undefined
        });

        let tableData = balance.filter((ele) => {
          return ele.amount !== undefined
        })

        const scotiaVisaObject = {
          Pdf: {
            StaticData: staticData,
            TableData: tableData,
          },
        };
        await pdfCollection.doc().set(scotiaVisaObject)
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          meaasge: "pdf uploaded successfully",
          response: scotiaVisaObject
        })
        //scotia visa ends here....
      } 
      else if (ispdfType.includes("11074 ELLERSLIE RD SOUTHWEST")) {
        
        const newArrayOfObj1 = arr.map(
          ({
            0: Date,
            1: Description,
            2: Withdrawals,
            3: Deposits,
            4: Balance,
            isEditable = false,
          }) => ({
            Date,
            Description,
            Withdrawals,
            Deposits,
            Balance,
            isEditable,
          })
        );
        for(let i=0;i<10;i++){
          if(newArrayOfObj1[i].Date==="Statement Of:"){
            var customerScotia=newArrayOfObj1[i-4].Date
          }
        }
        for(let i=0;i<10;i++){
          if(newArrayOfObj1[i].Date==="Business Account"){
            var accountScotia=newArrayOfObj1[i].Description
            var stmtScotia=newArrayOfObj1[i].Withdrawals
          }
        }
        let staticData = {
          StatementType: "FINANCE STATEMENT",
          FinancialInstitution: "SCOTIA BANK",
          AccountNumber: accountScotia,
          Date: demo.getTime(),
          UploadedMonth: moment().format("MMMM"),
          CustomerName: customerScotia,
          StatementDate: stmtScotia,
          BusinessType: "--",
          ExpenseType: "",
          UploadedDateTime: UploadedDateTime,
          sortDate: new Date()
        };
        newArrayOfObj1.splice(0, 14);
        newArrayOfObj1.forEach((ele, i) => {
          if (ele.Date === "904-91 ST SW 82719") {
            newArrayOfObj1.splice(i - 1, 7);
          }
        });
        newArrayOfObj1.forEach((ele, i) => {
          if (ele.Date === "No. of Debits") {
            newArrayOfObj1.splice(i, 2);
          }
        });

        newArrayOfObj1.forEach((ele, i) => {

          if (ele.Deposits === undefined && ele.Balance === undefined) {
            ele.Balance = ele.Withdrawals;
            ele.Deposits = "";
            ele.Withdrawals = "";
          } else {
            (ele.Balance = ele.Deposits), (ele.Deposits = "");
          }
        });
        for (let i = 0; i < newArrayOfObj1.length; i++) {
          if (newArrayOfObj1[i].Date === "Uncollected fees and/or ODI owing:") {
            newArrayOfObj1.splice(i, newArrayOfObj1.length);
          }
        }
        for (let i = 1; i < newArrayOfObj1.length; i++) {
           if (
            newArrayOfObj1[i].Description === undefined &&
            newArrayOfObj1[i + 1].Description === undefined &&
            newArrayOfObj1[i + 2].Description===undefined
          ) {
            newArrayOfObj1[i - 1].Description =
              newArrayOfObj1[i - 1].Description +
              " " +
              newArrayOfObj1[i].Date +
              " " +
              newArrayOfObj1[i + 1].Date +
              " " +
              newArrayOfObj1[i + 2].Date;

              newArrayOfObj1.splice(i,3)
          } else if (
            newArrayOfObj1[i].Description === undefined &&
            newArrayOfObj1[i + 1].Description === undefined
          ) {
            newArrayOfObj1[i - 1].Description =
              newArrayOfObj1[i - 1].Description +
              " " +
              newArrayOfObj1[i].Date +
              " " +
              newArrayOfObj1[i + 1].Date;

              newArrayOfObj1.splice(i,2)

          } else if (newArrayOfObj1[i].Description === undefined) {
            newArrayOfObj1[i - 1].Description =
              newArrayOfObj1[i - 1].Description + " " + newArrayOfObj1[i].Date;

              newArrayOfObj1.splice(i,1)

          }
        }
        
        for (let i = 1; i < newArrayOfObj1.length; i++) {
          if (newArrayOfObj1[i].Balance < newArrayOfObj1[i - 1].Balance) {
            newArrayOfObj1[i].Deposits = newArrayOfObj1[i].Withdrawals;
            newArrayOfObj1[i].Withdrawals = "";
          }
        }
        
        const scotiaObject = {
          Pdf: {
            StaticData: staticData,
            TableData: newArrayOfObj1,
          },
        };
        await pdfCollection.doc().set(scotiaObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "file uploaded successfully",
          response: scotiaObject,
        });
        //scotia ends here....
      }
      else if (ispdfType.includes("www.rbcroyalbank.com/business")) {
        const tableData = arr.map(
          ({
            0: Date,
            1: Description,
            2: Withdrawals,
            3: Deposits,
            4: Balance,
            5: e,
            isEditable = false,
          }) => ({
            Date,
            Description,
            Withdrawals,
            Deposits,
            Balance,
            e,
            isEditable,
          })
        );
        for (let i = 0; i < tableData.length; i++) {
          if (tableData[i].Date.startsWith("RBBD")) {
            var customername = tableData[i + 1].Date;
          }
          if (tableData[i].Date.startsWith("Accountnumber")) {
            if (tableData[i].Description === undefined) {
              var accountnumber =
                tableData[i - 1].Date + "  " + tableData[i - 1].Description;
            } else if (tableData[i].Description !== undefined) {
              var accountnumber =
                tableData[i].Description + "  " + tableData[i].Withdrawals;
            }
          }
        }
        let staticData = {
          StatementType: "FINANCE STATEMENT",
          FinancialInstitution: "ROYAL BANK OF CANADA",
          UploadedDateTime: UploadedDateTime,
          UploadedMonth: moment().format("MMMM"),
          CustomerName: customername,
          AccountNumber: accountnumber,
          BusinessType: "--",
          ExpenseType: "",
          Date: demo.getTime(),
          sortDate: new Date()
        };
        for (let i = 0; i < tableData.length; i++) {
          if (tableData[i].Date === "Closingbalance") {
            tableData.splice(i + 1, tableData.length);
          }
        }
        for (let i = 0; i < tableData.length; i++) {
          if (tableData[i].Date === "Description") {
            var RBC = tableData.splice(i + 1, tableData.length);
          }
        }
        for (let i = 0; i < RBC.length; i++) {
          if (RBC[i].Date.includes("of")) {
            RBC.splice(i, 6);
          }
        }
        RBC.forEach((ele, i) => {
          if (ele.Description === "Cheques&Debits($)") {
            RBC.splice(i, 1);
          }
        });
        RBC.forEach((ele, i) => {
          temp = ele.Description;
          if (ele.Date.includes("Opening") || ele.Date.includes("Closing")) {
            ele.Description = ele.Date;
            ele.Date = "";
            ele.Balance = temp;
            ele.Deposits = "";
            ele.Withdrawals = "";
          }
        });
        RBC.forEach((ele, i) => {
          if (ele.Description === undefined) {
            ele.Description = "";
          } else if (ele.Withdrawals === undefined) {
            ele.Withdrawals = "";
          } else if (ele.Deposits === undefined) {
            ele.Deposits = "";
          } else if (ele.Balance === undefined) {
            ele.Balance = "";
          } else if (ele.e === undefined) {
            ele.e = "";
          }
        });
        RBC.forEach((ele, i) => {
          if (ele.Description.startsWith("0")) {
            ele.Description = ele.Withdrawals + ele.Deposits;
            ele.Withdrawals = ele.Balance;
            ele.Balance = ele.e;
            ele.e = "";
            ele.Deposits = "";
          }
          if (
            ele.Date.includes("Payroll") ||
            ele.Date.startsWith("OnlineBankingpayment") ||
            ele.Date.includes("Misc") ||
            ele.Date.includes("Onlinetransfersent")
          ) {
            RBC[i].Description = RBC[i].Date + " " + RBC[i].Description;
            RBC[i].Date = "";
            ele.e = "";
          }
          if (ele.Date === "Monthlyfee") {
            RBC[i].Balance = RBC[i].Withdrawals;
            RBC[i].Withdrawals = RBC[i].Description;
            RBC[i].Description = RBC[i].Date;
            RBC[i].Date = "";
            ele.e = "";
          }
          if (ele.Date.includes("OnlineBankingtransfer")) {
            RBC[i].Balance = RBC[i].Withdrawals;
            RBC[i].Withdrawals = RBC[i].Description;
            RBC[i].Description = RBC[i].Date;
            RBC[i].Date = "";
            ele.e = "";
          }
          if (ele.Date === "" && ele.Deposits !== "") {
            ele.Balance = ele.Deposits;
          }
          if (ele.Date !== "" && ele.Date.startsWith("07") === false) {
            if (ele.Withdrawals.includes(".") === false) {
              RBC[i].Description = RBC[i].Description + "" + RBC[i].Withdrawals;
              RBC[i].Withdrawals = ele.Deposits;
              RBC[i].Deposits = "";
              ele.e = "";
            } else {
              RBC[i].Balance = ele.Deposits;
              RBC[i].Deposits = "";
              ele.e = "";
            }
          }
        });

        RBC.forEach((ele, i) => {
          if (ele.Deposits !== "") {
            if (
              ele.Description.includes("Onlinetransfersent-") &&
              ele.Date.startsWith("07") === false
            ) {
              ele.Balance = ele.Deposits;
              ele.Deposits = "";
            }
          }
          if (ele.Description.includes("Deposit") && ele.Withdrawals !== "") {
            ele.Balance = ele.Deposits;
            ele.Deposits = ele.Withdrawals;
            ele.Withdrawals = "";
          }
        });

        const rbcObject = {
          Pdf: {
            StaticData: staticData,
            TableData: RBC,
          },
        };

        await pdfCollection.doc().set(rbcObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          message: "PDF uploaded successfully",
          response: rbcObject,
        });
        //rbc ends here.....
      }
      else if (ispdfType.includes("rbc.com/businesscashback")) {
        customerName = []
        accountNumber = []
        let firstArray = arr.slice(9, 360)
        const newArrayOfObj1 = firstArray.map(
          ({
            0: transDate,
            1: postDate,
            2: description,
            3: amount,
            4: val1,
            5: val2,
            6: val3,
            7: val4,
            8: val5,
            9: val6,
            10: val7,
            11: val8,
            12: val9,
            isEditable = false,
          }) => ({
            transDate,
            postDate,
            description,
            amount,
            val1,
            val2,
            val3,
            val4,
            val5,
            val6,
            val7,
            val8,
            val9,
            isEditable,
          })
        );
        for (let i = 0; i < newArrayOfObj1.length; i++) {
          if (newArrayOfObj1[i].postDate === "RATE") {
            newArrayOfObj1.splice(i, newArrayOfObj1.length);
          }
        }
        for (let i = 0; i < newArrayOfObj1.length; i++) {
          if (newArrayOfObj1[i].transDate === "RBCROYAL") {
            newArrayOfObj1.splice(i, 27);
          }
        }
        newArrayOfObj1.forEach((ele, i) => {
          if (ele.val9 !== undefined) {
            ele.transDate = ele.transDate + ele.postDate
            ele.postDate = ele.description + ele.amount
            ele.description = ele.val1 +" "+ ele.val2 +" "+ ele.val3+" " + ele.val4+" " + ele.val5+" " + ele.val6 +" "+ ele.val7+" " + ele.val8
            ele.amount = ele.val9
            ele.val1 = undefined
            ele.val2 = undefined
            ele.val3 = undefined
            ele.val4 = undefined
            ele.val5 = undefined
            ele.val6 = undefined
            ele.val7 = undefined
            ele.val8 = undefined
            ele.val9 = undefined
          }
          if (ele.val3 === "****") {
            ele.transDate = ele.val1
            ele.postDate = ele.val2
            ele.description = ele.val3
            ele.amount = ele.val4
            ele.val1 = undefined
            ele.val2 = undefined
            ele.val3 = undefined
            ele.val4 = undefined
            ele.val5 = undefined
            ele.val6 = undefined
            ele.val7 = undefined
            ele.val8 = undefined
            ele.val9 = undefined
          }
          if (ele.val8 !== undefined) {
            ele.postDate = ele.postDate + ele.description
            ele.description = ele.amount+" " + ele.val1+" " + ele.val2 +" "+ ele.val3+" " + ele.val4+" " + ele.val5+" " + ele.val6+" " + ele.val7
            ele.amount = ele.val8
            ele.val1 = undefined
            ele.val2 = undefined
            ele.val3 = undefined
            ele.val4 = undefined
            ele.val5 = undefined
            ele.val6 = undefined
            ele.val7 = undefined
            ele.val8 = undefined
            ele.val9 = undefined
          }
          else if (ele.description === undefined && ele.transDate !== undefined && ele.postDate !== undefined) {
            ele.amount = "$"
          }
          else if (ele.transDate !== undefined && ele.postDate === undefined) {
            ele.amount = "$"
          }
          else if (ele.description === "PAYPAL") {
            ele.description = ele.description+" " + ele.amount
            ele.amount = ele.val1
            ele.val1 = undefined
          }
          if (ele.description === undefined) {
            ele.description = ""
          }
          if (ele.postDate === undefined) {
            ele.postDate = ""
          }
          if (ele.amount === undefined && ele.description !== undefined && ele.transDate !== undefined
            && ele.postDate !== undefined) {
            ele.amount = "-$"
          }

          if (ele.transDate === "Purchases" || ele.transDate === "CONTACT"
            || ele.transDate === "Annual" || ele.transDate === "Previous" || ele.transDate.endsWith("&")) {
            ele.amount = undefined
          }
          if (ele.val1 !== undefined || ele.val2 !== undefined) {
            ele.amount = undefined
          }
        });
        let filterArray = newArrayOfObj1.filter((ele) => {
          return ele.amount !== undefined
        })
        filterArray.forEach((element, i) => {
          if (!element.amount.startsWith("$") && !element.amount.startsWith("-")
            && !element.description.startsWith("*")) {
            element.amount = undefined
          }
          else if (element.transDate.endsWith("%")) {
            element.amount = undefined
          }
          else if (element.transDate === "TRANSACTION" || element.transDate === "DATE"
            || element.transDate === "Website" || element.transDate === "STATEMENT"
            || element.transDate === "mobile" || element.transDate === "ForeignCurrency-USD") {
            element.amount = undefined
          }
          if (element.postDate.startsWith("$") || element.postDate === "&" || element.postDate === "OF") {
            element.amount = undefined
          }
          if (element.description.startsWith("$") || element.description.endsWith("%")
            || element.description === "BALANCE") {
            element.amount = undefined
          }
        });
        let finalArray = filterArray.filter((ele) => {
          return ele.amount !== undefined
        })
        finalArray.forEach(ele => {
          if (ele.description === "") {
            ele.amount = undefined
            ele.description = undefined
          }
          if (ele.postDate === "") {
            ele.postDate = undefined
          }
        });


        let result = finalArray.filter((res) => {
          return res.amount !== "$"
        })
        for (let i = 0; i < result.length; i++) {

          if (result[i].postDate === undefined) {
            result[i]['transId'] = result[i]['transDate'];
            delete result[i]['transDate'];
            delete result[i]['postDate'];
            delete result[i]['description'];
            delete result[i]['amount'];
            delete result[i]['val1'];
            delete result[i]['val2'];
            delete result[i]['val3'];
            delete result[i]['val4'];
            delete result[i]['val5'];
            delete result[i]['val6'];
            delete result[i]['val7'];
            delete result[i]['val8'];
            delete result[i]['val9'];
            delete result[i]['isEditable'];

            let conObj = {
              ...result[i - 1], ...result[i]
            }
            result.splice(i - 1, 2, conObj)
          }
        }
        result.forEach((res) => {
          if (res.transId !== undefined) {
            res.description = res.description + " " + res.transId
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
          else if (res.transDate !== undefined && res.postDate !== undefined && res.description === undefined) {
            res.transDate = res.transDate + res.postDate
            res.postDate = ""
            res.description = ""
            res.amount = ""
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
          else if (res.description === "****") {
            res.transDate = res.transDate + res.postDate + res.description + res.amount
            res.postDate = ""
            res.description = ""
            res.amount = ""
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
          else if (res.transDate !== undefined && res.postDate !== undefined
            && res.description !== undefined && res.val1 === undefined) {
            res.transDate = res.transDate + res.postDate + res.description
            res.postDate = ""
            res.description = ""
            res.amount = ""
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
        });
        result.forEach((res) => {
          if (res.transId !== undefined) {
            res.description = res.description + " " + res.transId
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
          else if (res.transDate !== undefined && res.postDate !== undefined && res.description === undefined) {
            res.transDate = res.transDate + res.postDate
            res.postDate = ""
            res.description = ""
            res.amount = ""
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
          else if (res.description === "****") {
            res.transDate = res.transDate + res.postDate + res.description + res.amount
            res.postDate = ""
            res.description = ""
            res.amount = ""
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
          else if (res.transDate !== undefined && res.postDate !== undefined
            && res.description !== undefined && res.val1 === undefined) {
            res.transDate = res.transDate + res.postDate + res.description
            res.postDate = ""
            res.description = ""
            res.amount = ""
            res.transId = ""
            res.val1 = ""
            res.val2 = ""
            res.val3 = ""
            res.val4 = ""
            res.val5 = ""
            res.val6 = ""
            res.val7 = ""
            res.val8 = ""
            res.val9 = ""
          }
        })
        for (var i = 0; i < result.length; i++) {
          if (result[i].transDate.includes("****")) {
            accountNumber.push(result[i].transDate)
            customerName.push(result[i - 1].transDate)
          }
        }
        let acountnm = customerName.toString()
        let acountnbr = accountNumber.toString()

        let staticData =
        {
          StatementType: "ACCOUNT STATEMENT",
          FinancialInstitution: " ROYAL BANK",
          UploadedDateTime: UploadedDateTime,
          UploadedMonth: moment().format('MMMM'),
          AccountNumber: acountnbr,
          CustomerName: acountnm,
          ExpenseType: "",
          Date: demo.getTime(),
          sortDate: new Date(),
        }
        const rbcmcObject = {
          Pdf: {
            StaticData: staticData,
            TableData: result,
          },
        };
        await pdfCollection.doc().set(rbcmcObject);
        if (fs.existsSync(`./uploads/${filesUploaded}`)) {
          fs.unlinkSync(`./uploads/${filesUploaded}`)
        }
        res.json({
          error: false,
          meaasge: "pdf uploaded successfully",
          response: rbcmcObject
        });
      } else if (ispdfType.includes("HRI")) {
     
        await runChildProcess(filesUploaded);
        let pdf = JSON.parse(fs.readFileSync('./pdf.json','utf-8')) ;
           let pdfObj=Object.values(pdf);
          const newArrayOfObj1 = pdfObj.map(
            ({
              0: transDate,
              1: postDate,
              2: description,
              3: amount,
              4: val1,
              5: val2,
              6: val3,
              7: val4,
              8: val5,
              9: val6,
              10: val7,
              11: val8,

              isEditable = false,
            }) => ({
              transDate,
              postDate,
              description,
              amount,
              val1,
              val2,
              val3,
              val4,
              val5,
              val6,
              val7,
              val8,
              isEditable,
            })
          );
         
          var RegExp=/[0-9]/g
          for(let i=0;i<newArrayOfObj1.length;i++){
            if(newArrayOfObj1[i].transDate==="CONTACT"){
              var companyName=newArrayOfObj1[i+3].transDate+" "+newArrayOfObj1[i+3].postDate+" "+newArrayOfObj1[i+3].description
            }
            if(newArrayOfObj1[i].description==="TRAVEL" && newArrayOfObj1[i].amount==="VISA" ){
              if(newArrayOfObj1[i].amount.search(RegExp)){
                var costmTD=newArrayOfObj1[i+2].transDate+" "+newArrayOfObj1[i+2].postDate+" "+newArrayOfObj1[i+2].description
              }else{
                var costmTD=newArrayOfObj1[i+2].transDate+" "+newArrayOfObj1[i+2].postDate+" "+newArrayOfObj1[i+2].description+" "+newArrayOfObj1[i+2].amount
              }
            }
            if(newArrayOfObj1[i].description==="TRAVEL" && newArrayOfObj1[i].amount==="VISA"){
              var acctTD=newArrayOfObj1[i+1].transDate+" "+newArrayOfObj1[i+1].postDate+" "+newArrayOfObj1[i+1].description+" "+newArrayOfObj1[i+1].amount
            }
          }
          let customerTD=[companyName,costmTD];
          let staticData = {
            StatementType: "ACCOUNT STATEMENT",
            FinancialInstitution: "TD",
            UploadedDateTime: UploadedDateTime,
            UploadedMonth: moment().format("MMMM"),
            AccountNumber: acctTD,
            CustomerName: customerTD.toString(),
            ExpenseType: "",
            Date: demo.getTime(),
            sortDate: new Date(),
          };

          for (let i = 0; i < newArrayOfObj1.length; i++) {
            if (
              newArrayOfObj1[i].transDate === "TRANSACTION" &&
              newArrayOfObj1[i].postDate === "POSTING" &&
              newArrayOfObj1[i].description === "Minimum"
            ) {
              var TDVisa = newArrayOfObj1.slice(i + 3, newArrayOfObj1.length);
            }
          }
          TDVisa.forEach((ele, i) => {
            if(TDVisa[i].transDate==="TD" && TDVisa[i].postDate==="CANADA"){
              TDVisa.splice(i,10)
            }
            if (
              TDVisa[i].postDate === "TOTAL" &&
              TDVisa[i].amount === "BALANCE" &&
              TDVisa[i].description === "NEW"
            ) {
              TDVisa.splice(i + 1, TDVisa.length);
            }
            if (
              TDVisa[i].transDate === "All" &&
              TDVisa[i].postDate === "trade-marks"
            ) {
              TDVisa.splice(i, 10);
            }
            if (TDVisa[i].transDate.includes("Continued")) {
              TDVisa.splice(i, 8);
            }
            if(ele.transDate==="Available"||ele.transDate==="Annual"){
              TDVisa.splice(i,1)
            }
          });
          TDVisa.forEach((ele, i) => {
            if (
              TDVisa[i].transDate.includes("CALCULATING") ||
              TDVisa[i].transDate.includes("Previous") ||
              TDVisa[i].transDate.includes("Purchases") ||
              TDVisa[i].transDate.includes("Cash")||
              TDVisa[i].transDate.includes("Sub-total")||
              TDVisa[i].transDate.includes("Payments")
             
            ) {
              TDVisa.splice(i, 1);
            }
            if(TDVisa[i].description.startsWith("$")){
              TDVisa.splice(i,1)

            }
            if(TDVisa[i].transDate.includes("NEW") && TDVisa[i].description==="MINIMUM"){
              TDVisa.splice(i,1)
            }
            
            if (TDVisa[i].transDate.includes("Fees")) {
              TDVisa.splice(i, 14);
            }
            if (TDVisa[i].transDate.includes("Interest")) {
              TDVisa.splice(i, 1);
            }
            if(TDVisa[i].postDate.includes("Make")&&TDVisa[i].description.includes("cheques")){
              TDVisa.splice(i,7)
            }
            if(TDVisa[i].transDate==="TOTAL" && TDVisa[i].postDate==="NEW")
            {
              TDVisa.splice(i+1,TDVisa.length)
            }
          });
          TDVisa.forEach((ele, i) => {
            if(ele.transDate.length< 3){
              ele.transDate=ele.postDate
              ele.postDate=ele.description
              ele.description=ele.amount
              ele.amount=ele.val1
              ele.val1=ele.val2
              ele.val2=ele.val3
              ele.val3=ele.val4
              ele.val4=ele.val5
              ele.val5=ele.val6
              ele.val6=ele.val7
              ele.val7=ele.val8
              ele.val8=""
            }
            if (ele.amount.startsWith("$")) {
              ele.val1 = "";
              ele.val2 = "";
              ele.val3 = "";
              ele.val4 = "";
              ele.val5 = "";
              ele.val6 = "";
              ele.val7 = "";
              ele.val8 = "";
            }
            if (ele.val1.startsWith("$")) {
              ele.val2 = "";
              ele.val3 = "";
              ele.val4 = "";
              ele.val5 = "";
              ele.val6 = "";
              ele.val7 = "";
              ele.val8 = "";
            }
            if (ele.val2.startsWith("$")) {
              ele.val3 = "";
              ele.val4 = "";
              ele.val5 = "";
              ele.val6 = "";
              ele.val7 = "";
              ele.val8 = "";
            }
            if (ele.val3.startsWith("$")) {
              ele.val4 = "";
              ele.val5 = "";
              ele.val6 = "";
              ele.val7 = "";
              ele.val8 = "";
            }
            if (ele.val4.startsWith("$")) {
              ele.val5 = "";
              ele.val6 = "";
              ele.val7 = "";
              ele.val8 = "";
            }
            if (ele.val5.startsWith("$")) {
              ele.val6 = "";
              ele.val7 = "";
              ele.val8 = "";
            }
            if (ele.val6.startsWith("$")) {
              ele.val7 = "";
              ele.val8 = "";
            }
            if (ele.val7.startsWith("$")) {
              ele.val8 = "";
            }
            
            if (
              ele.transDate.startsWith("JAN") ||
              ele.transDate.startsWith("FEB") ||
              ele.transDate.startsWith("MAR") ||
              ele.transDate.startsWith("APR") ||
              ele.transDate.startsWith("MAY") ||
              ele.transDate.startsWith("JUN") ||
              ele.transDate.startsWith("JUL") ||
              ele.transDate.startsWith("AUG") ||
              ele.transDate.startsWith("SEP") ||
              ele.transDate.startsWith("OCT") ||
              ele.transDate.startsWith("NOV") ||
              ele.transDate.startsWith("DEC")
            ) {
              ele.transDate = ele.transDate + " " + ele.postDate;
              ele.postDate = ele.description + " " + ele.amount;
              ele.description = ele.val1;
              ele.amount = ele.val2;
              ele.val1 = ele.val3;
              ele.val2 = ele.val4;
              ele.val3 = ele.val5;
              ele.val4 = ele.val6;
              ele.val5 = ele.val7;
              ele.val6 = ele.val8;
              ele.val7 = "";
              ele.val8 = "";
             
              if (
                ele.val1.startsWith("$") || ele.val1.startsWith("-")
              ) {
                ele.description = ele.description +" "+ ele.amount;
                ele.amount = ele.val1;
                ele.val1 = ele.val2;
                ele.val2 = ele.val3;
                ele.val3 = ele.val4;
                ele.val4 = ele.val5;
                ele.val5 = ele.val6;
                ele.val6 = ele.val7;
                ele.val7 = ele.val8;
                ele.val8 = "";
              }
             else if (
                ele.val2.startsWith("$")|| ele.val2.startsWith("-")
              ) {
                ele.description = ele.description +" "+ ele.amount+" "+ele.val1;
                
                ele.amount = ele.val2;
                ele.val1 = ele.val3;
                ele.val2 = ele.val4;
                ele.val3 = ele.val5;
                ele.val4 = ele.val6;
                ele.val5 = ele.val7;
                ele.val6 = ele.val8;
                ele.val7 = "";
                ele.val8 = "";

              }
              else if (
                ele.val3.startsWith("$")|| ele.val3.startsWith("-")
              ) {
                ele.description = ele.description +" "+ ele.amount+" "+ele.val1+" "+ele.val2;
                ele.amount = ele.val3;
                ele.val1 = ele.val5;
                ele.val2 = ele.val6;
                ele.val3 = ele.val7;
                ele.val4 = ele.val8;
                ele.val5 = "";
                ele.val6 = "";
                ele.val7 = "";
                ele.val8 = "";
              }
              else if (
                ele.val4.startsWith("$")|| ele.val4.startsWith("-")
              ) {
                ele.description = ele.description +" "+ ele.amount+" "+ele.val1+" "+ele.val2+" "+ele.val3;
                ele.amount = ele.val4;
                ele.val1 = ele.val5;
                ele.val2 = ele.val6;
                ele.val3 = ele.val7;
                ele.val4 = ele.val8;
                ele.val5 = "";
                ele.val6 = "";
                ele.val7 = "";
                ele.val8 = "";
              } else if (
                ele.val5.startsWith("$")|| ele.val5.startsWith("-")
              ) {
                ele.description = ele.description +" "+ ele.amount+" "+ele.val1+" "+ele.val2+" "+ele.val3+" "+ele.val4 ;
                ele.amount = ele.val5;
                ele.val1 = ele.val6;
                ele.val2 = ele.val7;
                ele.val3 = ele.val8;
                ele.val4 = "";
                ele.val5 = "";
                ele.val6 = "";
                ele.val7 = "";
                ele.val8 = "";
              }else if (
                ele.val5.startsWith("$")|| ele.val5.startsWith("-")
              ) {
                ele.description = ele.description +" "+ ele.amount+" "+ele.val1+" "+ele.val2+" "+ele.val3+" "+ele.val4+" "+ele.val5 ;
                ele.amount = ele.val6;
                ele.val1 = ele.val7;
                ele.val2 = ele.val8;
                ele.val3 = "";
                ele.val4 = "";
                ele.val5 = "";
                ele.val6 = "";
                ele.val7 = "";
                ele.val8 = "";
              }
              if (ele.amount.startsWith("$")|| ele.amount.startsWith("-")) {
                ele.val1 = "";
                ele.val2 = "";
                ele.val3 = "";
                ele.val4 = "";
                ele.val5 = "";
                ele.val6 = "";
                ele.val7 = "";
                ele.val8 = "";
              }
              
              
          }
           
          });
          TDVisa.forEach((ele, i)=>{
            if(TDVisa[i].postDate.length<3){
                ele.postDate=""
              }
          })
          for (let i =1;i<TDVisa.length;i++){
            if((!TDVisa[i].transDate.startsWith("JAN") ||
            !TDVisa[i].transDate.startsWith("FEB") ||
            !TDVisa[i].transDate.startsWith("MAR") ||
            !TDVisa[i].transDate.startsWith("APR") ||
            !TDVisa[i].transDate.startsWith("MAY") ||
            !TDVisa[i].transDate.startsWith("JUN") ||
            !TDVisa[i].transDate.startsWith("JUL") ||
            !TDVisa[i].transDate.startsWith("AUG") ||
            !TDVisa[i].transDate.startsWith("SEP") ||
            !TDVisa[i].transDate.startsWith("OCT") ||
            !TDVisa[i].transDate.startsWith("NOV") ||
            !TDVisa[i].transDate.startsWith("DEC"))&& (!TDVisa[i].amount.startsWith("$"))&&(!TDVisa[i].amount.startsWith("-"))){
              TDVisa[i].description= TDVisa[i].transDate+" "+TDVisa[i].postDate+"" +TDVisa[i].description+" "+TDVisa[i].amount
              TDVisa[i].transDate=""
              TDVisa[i].postDate=""
              TDVisa[i].amount=""
             
            }
            
            
          }
          for(let i=1;i<TDVisa.length;i++){
            
            if(TDVisa[i].transDate.startsWith("JAN") ||
            TDVisa[i].transDate.startsWith("FEB") ||
            TDVisa[i].transDate.startsWith("MAR") ||
            TDVisa[i].transDate.startsWith("APR") ||
            TDVisa[i].transDate.startsWith("MAY") ||
            TDVisa[i].transDate.startsWith("JUN") ||
            TDVisa[i].transDate.startsWith("JUL") ||
            TDVisa[i].transDate.startsWith("AUG") ||
            TDVisa[i].transDate.startsWith("SEP") ||
            TDVisa[i].transDate.startsWith("OCT") ||
            TDVisa[i].transDate.startsWith("NOV") ||
            TDVisa[i].transDate.startsWith("DEC")){
             
              if(TDVisa[i+1].transDate==="" && TDVisa[i+2].transDate==="" && !TDVisa[i+1].val1.includes("$")){
                TDVisa[i].description=TDVisa[i].description+" "+TDVisa[i+1].description+" "+TDVisa[i+2].description
                TDVisa.splice(i+1,2)
              }
              if(TDVisa[i+1].transDate===""){
                if(!TDVisa[i+1].val1.includes("$") ){
                  TDVisa[i].description=TDVisa[i].description+" "+TDVisa[i+1].description
                  TDVisa.splice(i+1,1)
                }
              }
            }else{
              if(TDVisa[i].transDate==="" && TDVisa[i].description.includes("NET")){
                if(TDVisa[i+1].transDate===""){
                  TDVisa[i].description=TDVisa[i].description+" "+TDVisa[i+1].description
                  TDVisa.splice(i+1,1)
                }
              }
            }
            
          }
          TDVisa.forEach((ele,i)=>{
            if(TDVisa[i].description==="BALANCE"){
              TDVisa[i].description=TDVisa[i].transDate+" "+TDVisa[i].postDate+" "+TDVisa[i].description
              TDVisa[i].transDate=""
              TDVisa[i].postDate=""
            }
          })
          TDVisa.forEach((ele,i)=>{
            if(TDVisa[i].transDate.startsWith("JAN") ||
            TDVisa[i].transDate.startsWith("FEB") ||
            TDVisa[i].transDate.startsWith("MAR") ||
            TDVisa[i].transDate.startsWith("APR") ||
            TDVisa[i].transDate.startsWith("MAY") ||
            TDVisa[i].transDate.startsWith("JUN") ||
            TDVisa[i].transDate.startsWith("JUL") ||
            TDVisa[i].transDate.startsWith("AUG") ||
            TDVisa[i].transDate.startsWith("SEP") ||
            TDVisa[i].transDate.startsWith("OCT") ||
            TDVisa[i].transDate.startsWith("NOV") ||
            TDVisa[i].transDate.startsWith("DEC") || (TDVisa[i].transDate==="" && (TDVisa[i].amount.startsWith("$") || TDVisa[i].val1.includes("$")))){
              ele.val8="undefined"
            }
          })
          let FinalTDVisa=TDVisa.filter((ele,i)=>{
            return ele.val8==="undefined"
          })
          FinalTDVisa.forEach((ele,i)=>{
            if(ele.val8==="undefined"){
              ele.val8=""
            }
            if(ele.val1!==""){
              ele.amount=ele.val1
              ele.val1=""
            }
          })
          const TDVisaObject = {
            Pdf: {
              StaticData: staticData,
              TableData: TDVisa,
            },
          };
       pdfCollection.doc().set(TDVisaObject);
       if (fs.existsSync(`./uploads/${filesUploaded}`)) {
        fs.unlinkSync(`./uploads/${filesUploaded}`)
      }
          res.json({
            error: false,
            meaasge: "pdf uploaded successfully",
            response: TDVisaObject,
          });
        
      }
      else {
        res.json({ error: true, message: "PDF not found"});
      }
    arr = [];
    }
    confrim();
  }
    
  } catch (err) {
    next(err.message);
  }
};

const updatePdf = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updatedData = req.body;
    const pdfCollection = await firebase.db.collection("pdf").doc(id);
    const data = await pdfCollection.update(updatedData);

    res.json({
      error: false,
      message: "Updated pdf successfully",
      response: data,
    });
  } catch (error) {
    next(error.message);
  }
};

const searchPdf = async (req, res, next) => {
  const dataRes = [];
  try {
    const {
      CustomerName,
      CustomerID,
      MerchantName,
      StatementType,
      startDate,
      endDate,
    } = req.body;

    const pdfCollection = await firebase.db.collection("pdf");

    const data = await pdfCollection.get();

    if (data.empty) {
      res.json({
        error: false,
        message: "No pdf found",
      });
    } else {
      var list = data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      list.forEach((ele, i) => {
        if (CustomerName !== undefined) {
          if (ele.Pdf.StaticData.CustomerName.toUpperCase().includes(CustomerName.toUpperCase()) === CustomerName.toUpperCase().includes(CustomerName.toUpperCase())) {
            dataRes.push(list[i]);
          }
        } else if (MerchantName !== undefined) {
          if (ele.Pdf.StaticData.FinancialInstitution.toUpperCase().includes(MerchantName.toUpperCase()) === MerchantName.toUpperCase().includes(MerchantName.toUpperCase())) {
            dataRes.push(list[i]);
          }
        } else if (CustomerID !== undefined) {
          if (ele.Pdf.StaticData.EmployeeID !== undefined) {
            if (ele.Pdf.StaticData.EmployeeID.toUpperCase().includes(CustomerID.toUpperCase()) === CustomerID.toUpperCase().includes(CustomerID.toUpperCase())) {
              dataRes.push(list[i]);
            }
          }
        } else if (ele.Pdf.StaticData.StatementType === StatementType) {
          dataRes.push(list[i]);
        }
        else if (startDate !== undefined && endDate !== undefined) {
          const splitStart = startDate.split('/');
          const localDay1 = splitStart[0];
          const localMonth1 = splitStart[1];
          const localYear1 = splitStart[2];

          const mainStartDate = localMonth1 + '/' + localDay1 + '/' + localYear1;
          const startMili = new Date(mainStartDate);
          const startDateMili = startMili.getTime();

          const splitEnd = endDate.split('/');
          const localDay2 = splitEnd[0];
          const localMonth2 = splitEnd[1];
          const localYear2 = splitEnd[2];

          const mainEndDate = localMonth2 + '/' + localDay2 + '/' + localYear2;
          const endMili = new Date(mainEndDate);
          const endDateMili = endMili.getTime();
          if (ele.Pdf.StaticData.Date !== undefined) {
            if (
              startDateMili <= ele.Pdf.StaticData.Date &&
              ele.Pdf.StaticData.Date <= endDateMili
            ) {
              dataRes.push(list[i]);
            }
          }
        }
      });
    }
    if (dataRes.length >= 1) {
      res.json(dataRes);
    } else {
      res.json({
        error: true,
        message: "No data found"
      })
    }
  } catch (error) {
    next(error.message);
  }
};

module.exports = {
  searchPdf,
};
module.exports = {
  addPdf,
  getPdf,
  getPdfWIthID,
  getPdfWIthMonth,
  updatePdf,
  searchPdf
};
