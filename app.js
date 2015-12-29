var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var method_override = require("method-override");
var mongoose = require("mongoose");
var PDFDocument = require('pdfkit');
var fs = require('fs');

var app = express();

mongoose.connect('mongodb://admin:12345@ds037195.mongolab.com:37195/estimaciones');
//mongoose.connect("mongodb://localhost/estimaciones");

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(method_override("_method"));



//el subdocumento en una variable, para reutilizarlo
var work = {
  clave: String,
  descripcion: String,
  unidad_medida: String,
  cantidad_planificada: Number,
  precio: Number,
  importe: Number
};

//definir el esquema de estimacion informacion escencial
var estimacionSchema = {
  fecha: String,
  operacion: String,
  oei: String,
  oe: String,
  central: String,
  pep: String,
  dd: String,
  ruta: String,
  enlace: String,
  area: String,
  poblacion: String,
  tipo_de_trabajo: String,
  contratista: String,
  zona_pago: {type:String, default:'VIDA CARA'},
  fecha_inicio: String,
  fecha_terminacion: String,
  superintendente: String,
  //haciendo uso de la variable del subdocumento
  trabajos: [work],
  total: {type:Number, default:0}
};

//definir el esquema de los trabajos, manejados por el admin
var trabajosSchema ={
  clave: String,
  descripcion: String,
  unidad_medida: String,
  precio: Number,
  tipo_trabajo: String
};

//asignando a una variable la estimacionSchema, de estimacion informacion escencial
var Estimacion = mongoose.model("Estimacion", estimacionSchema);
//asignando a una variable de los trabajosSchema
var Trabajos = mongoose.model("Trabajos", trabajosSchema);

//delimita que nuestro motor de render de vistas sera jade
app.set("view engine", "jade");

//usamos una carpeta publica para los demas componentes, componentes accesibles
app.use(express.static(__dirname + "/public"));

  /*************************************************************************
          ACCIONES PARA EL USUARIO NORMAL O CONTRATISTA

  *************************************************************************/

  //muestra la vista de la pagina inicial(ruta)
  app.get("/", function(solicitud, respuesta){
    respuesta.render("index");
  });

  //mostrar todas las estimaciones {SE QUITARA, NO ES NECESARIO MOSTRAR O PUEDE QUE SE QUEDE!!!}
  app.get("/menu", function(solicitud,respuesta){
    Estimacion.find(function(error, documento){
      if(error){console.log(documento);}
      respuesta.render("menu/estimaciones", {estimacions: documento})
    });
  });

  //creando la vista de crear las estimaciones!
  app.get("/menu/crear", function(solicitud,respuesta){
    respuesta.render("menu/crear");
  });

  //creame las estimaciones enviando datos por el metodo Post
  app.post("/menu",function(solicitud, respuesta){
    console.log(solicitud.bodyParser);
    //variable que me solicita todos los valores de los inputs!
    var data = {
      fecha: solicitud.body.fecha,
      operacion: solicitud.body.operacion,
      oei: solicitud.body.oei,
      oe: solicitud.body.oe,
      central: solicitud.body.central,
      pep: solicitud.body.pep,
      dd: solicitud.body.dd,
      ruta: solicitud.body.ruta,
      enlace: solicitud.body.enlace,
      area: solicitud.body.area,
      poblacion: solicitud.body.poblacion,
      tipo_de_trabajo: solicitud.body.tipo_trabajo,
      contratista: solicitud.body.contratista,
      fecha_inicio: solicitud.body.fecha_inicio,
      fecha_terminacion: solicitud.body.fecha_terminacion,
      superintendente: solicitud.body.superintendente,
      };  

    //guardame los datos y redireccioname la vista de admicontratistas
    var estimacion = new Estimacion(data);
      estimacion.save(function(err){
      console.log(estimacion);
      respuesta.redirect("../admincontratistas");
      }); 
  });


  //vista para ver el form login contratistas(rutas)
  app.get("/admincontratistas", function(solicitud, respuesta){
    respuesta.render("admincontratistas/form");
  });

  /*vista creada especialmente para recurrir a un retorno al finalizar o cancelar 
  las acciones del admincontratista*/
  app.get("/admincontratistas/_", function(solicitud, respuesta){
    Estimacion.find(function(error, documento){
        if(error){
          console.log(error);
        }
      respuesta.render("admincontratistas/index", {estimacions: documento})
    });
  });


  //accion que realiza al colocar el admin, redirijir al index del panel de admon del contratista
  app.post("/admincontratistas", function(solicitud, respuesta){
    if ((solicitud.body.password == "admin") || (solicitud.body.password == "ADMIN"))
      {
        Estimacion.find(function(error, documento){
          if(error){ console.log(error); }
          respuesta.render("admincontratistas/index", {estimacions: documento})
        });
      }
    else 
      { 
        respuesta.redirect("/admincontratistas");
      }
  });


  //ruta de edicion de datos escenciale de la estimacion
  app.get("/menu/editar/:id", function(solicitud, respuesta){ 
    var id_estimacion = solicitud.params.id;    
    Estimacion.findOne({"_id":id_estimacion}, function(error, estimacion){
      respuesta.render("menu/editar",{estimacions: estimacion});
    });
  });

  /*actualizame los datos escenciales de la estimacion
    #no todos los navegadores soportan put!, sin embargo
    utilizar method_override para parsear esto y utilizarlo.
  */
  app.put("/menu/:id",function(solicitud, respuesta){
    var data = {
      fecha: solicitud.body.fecha,
      operacion: solicitud.body.operacion,
      oei: solicitud.body.oei,
      oe: solicitud.body.oe,
      central: solicitud.body.central,
      pep: solicitud.body.pep,
      dd: solicitud.body.dd,
      ruta: solicitud.body.ruta,
      enlace: solicitud.body.enlace,
      area: solicitud.body.area,
      poblacion: solicitud.body.poblacion,
      tipo_de_trabajo: solicitud.body.tipo_de_trabajo,
      contratista: solicitud.body.contratista,
      fecha_inicio: solicitud.body.fecha_inicio,
      fecha_terminacion: solicitud.body.fecha_terminacion,
      superintendente: solicitud.body.superintendente,
    };
    
    Estimacion.update({ "_id": solicitud.params.id}, data, function(error, estimacion){
      console.log(estimacion);
      Estimacion.find(function(error, documento){
        if(error){
          console.log(error);
        }
        respuesta.redirect('/menu/editar/' + solicitud.params.id );
      });
    });
  });


  /*ruta de edicion de los trabajos que se encuentran en la misma de edicion de estimaciones,
    sin embargo estos hacen render a la vista editar-trabajos, para modificar el contenido
  */
  app.get("/menu/editar/:id/:i", function(req, res){
    Estimacion.find({"trabajos": {$elemMatch : {"_id": req.params.i }}}, "trabajos.$" , function(err,data){
        res.render('menu/editar-trabajos', {datos: data});
      });
  });

  //actualizame los trabajos que se encuentra en el subdocumento de la estimacion
  app.put("/menu/:id/:idt", function(req, res){
    Estimacion.find({"trabajos": {$elemMatch : {"_id": req.params.i }}}, "trabajos.$" , function(err,data){
        Estimacion.update(
          {"_id": req.params.id, 'trabajos._id': req.params.idt }, 
            {'$set': {
              'trabajos.$.clave': req.body.clave,
              'trabajos.$.descripcion': req.body.descripcion,
              'trabajos.$.unidad_medida': req.body.unidad_medida,
              'trabajos.$.cantidad_planificada': req.body.cantidad_planificada,
              'trabajos.$.precio': req.body.precio,
              'trabajos.$.importe': req.body.cantidad_planificada * req.body.precio
              }
          },
          function(err, numAffected) {
            res.redirect('/menu/editar/' + req.params.id );
      });
      });
  });

  /*eliminame un trabajo del subdocumento de la estimacion,
  cuando se elimine, por favor redirijeme a mismo menu, con el
  mismo id de la estimacion en donde me encuentro editando
  */
  app.delete("/eliminar-trabajo/:id/:idt", function(req, res){
    console.log("eliminado");
    Estimacion.update(
      {}, 
      {$pull: {"trabajos": {"_id": req.params.idt}}},  
      { multi: true },
      function(err, data){
        res.redirect('/menu/editar/' + req.params.id );
      }
    );
  });   
  
  

  //vista para eliminar una estimacion completa
  app.get("/menu/delete/:id", function(solicitud, respuesta){
    var id= solicitud.params.id;
    Estimacion.findOne({"_id": id}, function(error, estimacion){
      respuesta.render("menu/delete", {estimacions: estimacion});
    });
  });

  //eliminame la estimacion si la contraseña que ingresaste en el loggin es correcta
  app.delete("/menu/:id", function(solicitud,respuesta){
    var id= solicitud.params.id;
    if((solicitud.body.password == "admin2") || (solicitud.body.password == "ADMIN2")){
      Estimacion.remove({"_id":id},function(error){
        if(error){console.log(err);}
        Estimacion.find(function(error, estimacion){
          if(error){ console.log(error);}
          respuesta.render("admincontratistas", {estimacions: estimacion})
        });
      });
    }
    /*si no logra ingresar la contraseña correcta regresamelo al mismo form de loggin, 
    para intentarlo nuevamente.
    */
    else{
      var id= solicitud.params.id;
      Estimacion.findOne({"_id": id}, function(error, estimacion){
        respuesta.render("menu/delete", {estimacions: estimacion});
      });
    }

  });

  //vista para mostrar el id, de la estimacion a la cual se le insertaran los trabajos
  app.get("/menu/insertar/:id", function(solicitud, respuesta){ 
    var id_estimacion = solicitud.params.id;
    Estimacion.findOne({"_id":id_estimacion}, function(error, estimacion){
      Trabajos.find(function(err, data) {       
        respuesta.render("menu/insertar",{estimacions: estimacion, trabajos: data});
        console.log(data);
      });
      console.log(error); 
    });
  });

  
  //insertame los trabajos al subdocumento de la estimacion, previamente consultados de la collection de trabajos
  app.post("/menu/:id",function(solicitud, respuesta){
    var a = {
      trabajos: { 
        clave: solicitud.body.clave,
        descripcion: solicitud.body.descripcion,
        unidad_medida: solicitud.body.unidad_medida,
        cantidad_planificada: solicitud.body.cantidad_planificada,
        precio: solicitud.body.precio,
        importe: solicitud.body.cantidad_planificada * solicitud.body.precio,
      }
    };
    /* la insercion aun subdocumento de un documento, se realiza mediante un update
    */
    Estimacion.update({ "_id": solicitud.params.id}, {$push: a}, function(error, estimacion){
      console.log(estimacion);
      var id_estimacion = solicitud.params.id;
      Estimacion.findOne({"_id":id_estimacion}, function(error, estimacion){
        console.log(error); 
        Trabajos.find(function(err, data) {       
          respuesta.render("menu/insertar",{estimacions: estimacion, trabajos: data});
        });
      });
    });
  });
  
    

  /****************************************************************
        ACCIONES PARA EL USUARIO ADMINISTRADOR
  
  *****************************************************************/


  
  //vista para ver el form login administradores de la Base de Datos
  app.get("/administradores", function(solicitud, respuesta){
    respuesta.render("administradores/form");
  });

  /*  acciones del form dependiendo de la entrada del administrador
    1. colocar panel, se dirige al panel de admin, donde puede realizar 
    distintas funciones para los trabajos.
    2. colocar trabajos, se dirige a ingresar trabajos a la base de datos.

  */
  app.post("/administradores", function(solicitud, respuesta){
    if((solicitud.body.password == "panel") || (solicitud.body.password == "PANEL")) {
      Trabajos.find(function(error, documento){
        if(error){console.log(error);}
        respuesta.render("administradores/index", {trabajos: documento})
      });
    }

    else if((solicitud.body.password == "trabajos") || (solicitud.body.password == "TRABAJOS")) {
      respuesta.render("trabajos/ingresar");
    }

    else{
      respuesta.redirect("/administradores");
    }
  });


  //vista ingresar trabajos, solo lo realiza el administrador
  app.get("/trabajos/ingresar", function(solicitud,respuesta){
    respuesta.render("trabajos/ingresar");
  });


  //Creame trabajos con la solicitud de los input del form ingresar
  app.post("/trabajos",function(solicitud, respuesta){
    console.log(solicitud.bodyParser);
    var data = {
      clave: solicitud.body.clave,
      descripcion: solicitud.body.descripcion,
      unidad_medida: solicitud.body.unidad_medida,
      precio: solicitud.body.precio,
      tipo_trabajo: solicitud.body.tipo_trabajo
      };  

  //guarda y reenvia la vista al index
    var trabajos = new Trabajos(data);
    trabajos.save(function(err){
      console.log(trabajos);
      respuesta.redirect("/trabajos/ingresar");
    }); 
  });

  //ruta para edicion de los trabajos
  app.get("/trabajos/editar/:id", function(solicitud, respuesta){ 
    var id_trabajo = solicitud.params.id;   
    Trabajos.findOne({"_id":id_trabajo}, function(error, trabajo){
      respuesta.render("trabajos/editar",{trabajos: trabajo});
    });
  });

  //actualizame los datos de los trabajos
  app.put("/trabajos/:id",function(solicitud, respuesta){
    var data = {
      clave: solicitud.body.clave,
      descripcion: solicitud.body.descripcion,
      unidad_medida: solicitud.body.unidad_medida,
      precio: solicitud.body.precio,
      tipo_trabajo: solicitud.body.tipo_trabajo
    };
    
    Trabajos.update({ "_id": solicitud.params.id}, data, function(error, trabajo){
      console.log(trabajo);
      Trabajos.find(function(error, documento){
        if(error){
          console.log(error);
        }
        respuesta.redirect('/trabajos/editar/' + solicitud.params.id );
      });
    });
  });

  
  //ruta para eliminar los trabajos
  app.get("/trabajos/eliminar/:id", function(solicitud, respuesta){
    var id= solicitud.params.id;
    Trabajos.findOne({"_id": id}, function(error, trabajo){
      respuesta.render("trabajos/eliminar", {trabajos: trabajo});
    });
  });

  //eliminame el trabajo si la contraseña del input es igual
  app.delete("/trabajos/:id", function(solicitud,respuesta){
    var id= solicitud.params.id;
    if((solicitud.body.password == "YES") || (solicitud.body.password == "yes")){
      Trabajos.remove({"_id":id},function(error){
        if(error){console.log(err);}
        Trabajos.find(function(error, trabajo){
          if(error){ console.log(error);}
          respuesta.render("administradores", {trabajos: trabajo})
        });
      });
    }
    /*si no logra ingresar la contraseña correcta regresamelo al mismo form de loggin, 
    para intentarlo nuevamente.
    */
    else{
      var id= solicitud.params.id;
      Trabajos.findOne({"_id": id}, function(error, trabajo){
        respuesta.render("trabajos/eliminar", {trabajos: trabajo});
      });
    }

  });


  //ruta para mostrar el panel de administradores en caso de cancelar o finalizar
  app.get("/administradores/_", function(solicitud, respuesta){
    Trabajos.find(function(error, documento){
        if(error){
          console.log(error);
        }
      respuesta.render("administradores/index", {trabajos: documento})
    });
  });










  /****************************************************************************
      IMPLEMENTANDO PDFKIT PARA LA SALIDA DEL FORMATO DE ESTIMACION

  *****************************************************************************/
  app.get("/pdf/:id", function(req, res){
    
    //creame un nuevo documento pdf con las sig. caracteristicas
    var doc = new PDFDocument({
            size : 'letter',
            info:{
              Title: 'Estimacion de obra',
              Author: 'Daniel Torres'
          },
          margin:37
    });

    //variables que seran usadas para mostrar, montos de la estimacion    
    var importe = 0;
    var importe_parcial = 0;
    var iva = 0;
    var pago_total = 0;
    //usado para realizar saltos de linea necesarios entre los trabajos
    var space = 210;
    
    //crecion del pdf
    doc.pipe(fs.createWriteStream(__dirname + '/public/output.pdf'));
    doc.image('public/img/logo.png',150, 270, {width: 300, height:200}).text('');
    
    doc.lineWidth(1);
    
    //cuadro completo
    doc.save()
      .moveTo(35, 70)                           
      .lineTo(575, 70)                           
      .lineTo(575, 620)
      .moveTo(35, 70)
      .lineTo(35, 620)
      .moveTo(35, 620)
      .lineTo(575, 620)
      //fecha
      .moveTo(575, 50)
      .lineTo(400, 50)
      .lineTo(400, 70)
      .moveTo(575, 50)
      .lineTo(575, 70)
        //parte que va la operacion
      .moveTo(35, 105)
      .lineTo(320, 105)
      .lineTo(320, 70)
        //parte DD
      .moveTo(35, 150)
      .lineTo(320, 150)
      .lineTo(320, 105)
        //linea abajo de fecha terminacion
      .moveTo(320, 150)
      .lineTo(575, 150)
        //linea en medio entre contratista y vida cara HORIZONTAL
      .moveTo(320, 112)
      .lineTo(575, 112)
        //linea enmedio de contratista y vida cara VERTICAL
      .moveTo(445, 70)
      .lineTo(445, 150)
        //linea de los concepts clave, descripcion
      .moveTo(35, 190)
      .lineTo(575, 190)
        //linea de text clave
      .moveTo(95,150)
      .lineTo(95, 190)
        //linea de la descripcion
      .moveTo(320, 150)
      .lineTo(320, 190)
        //linea de unidad de medida
      .moveTo(380, 150)
      .lineTo(380, 190)
        //linea de cantidad planificada
      .moveTo(445, 150)
      .lineTo(445, 190)
        //linea de precio
      .moveTo(510, 150)
      .lineTo(510, 190)

      //Lineas de las firmas PROCISA
      //constructor
      .moveTo(40, 700)
      .lineTo(200, 700)

      //liquidador
      .moveTo(220, 700)
      .lineTo(370, 700)

      //Superintendente
      .moveTo(390, 700)
      .lineTo(570, 700)

      //nombre,firma y fecha
      //constructor
      .moveTo(40, 740)
      .lineTo(200, 740)

      //liquidador
      .moveTo(220, 740)
      .lineTo(370, 740)

      //Superintendente
      .moveTo(390, 740)
      .lineTo(570, 740)
    .stroke();
    
    //parte de los trabajos
    doc.fontSize(8).text("CLAVE",50, 160);
    doc.fontSize(8).text("UNIDAD", 48, 170);
    doc.fontSize(8).text("DESCRIPCIÓN", 100, 170);
    doc.fontSize(8).text("UNIDAD", 335, 160);
    doc.fontSize(8).text("MEDIDA", 335, 170);
    doc.fontSize(8).text("CANTIDAD", 390, 160);
    doc.fontSize(8).text("PLANIFICADA", 385, 170);
      doc.fontSize(8).text("PRECIO", 463, 170);
      doc.fontSize(8).text("IMPORTE",525, 170); 

      //Realizando un find a la BD, para buscar la estimacion deseada!
    Estimacion.findOne({"_id" : req.params.id}, function(err, data) {
      doc.fontSize(12).text("Fecha:    " + data.fecha, 424, 55);
      doc.fontSize(14).text('Estimacion No. # ' + data.id, 37, 40);
      doc.fontSize(8).text("OPERACIÓN: " + data.operacion, 37, 75,{align: 'left', width: 120, height: 10});
      doc.fontSize(8).text("OEI: " + data.oei, 170, 75,{align: 'left', width: 50, height: 10});
      doc.fontSize(8).text("OE: " + data.oe, 250, 75,{align: 'left', width: 50, height: 10});
      doc.fontSize(8).text("CENTRAL: " + data.central, 60, 90,{align: 'left', width: 90, height: 10});
      doc.fontSize(8).text("PEP: " + data.pep, 180, 90,{align: 'left', width: 140, height: 10});
      doc.fontSize(7).text("DD: " + data.dd, 37, 110,{align: 'left', width: 50, height: 10});
      doc.fontSize(7).text("RUTA: " + data.ruta, 90, 110,{align: 'left', width: 50, height: 10});
      doc.fontSize(7).text("ENLACE: " + data.enlace, 155, 110,{align: 'left', width: 165, height: 10});
      doc.fontSize(7).text("ÁREA: " + data.area,37, 125,{align: 'left', width: 120, height: 10});
      doc.fontSize(7).text("POBLACIÓN: " + data.poblacion, 155, 125,{align: 'left', width: 130, height: 10});
      doc.fontSize(7).text("TIPO DE TRABAJO: " + data.tipo_de_trabajo, 37, 140,{align: 'left', width: 260, height: 10});
      doc.fontSize(8).text("CONTRATISTA: ", 323, 75);
      doc.fontSize(7).text(data.contratista, 323, 100,{align: 'left', width: 140, height: 10});
      doc.fontSize(8).text("ZONA DE PAGO: ", 450, 75);
      doc.fontSize(10).text(data.zona_pago, 480, 100);
      doc.fontSize(8).text("Fecha Estimada Inicio: ", 323, 120);
      doc.fontSize(9).text(data.fecha_inicio, 485, 120);
      doc.fontSize(8).text("Fecha Terminación: ", 323, 135);
      doc.fontSize(9).text(data.fecha_terminacion, 485, 135);

      for(var j=0; j<data.trabajos.length; j++){
       //Haz una busqueda de los trabajos que estan en el subdocumento(array) 
        doc.fontSize(9).text(data.trabajos[j].clave, 40, space,{align: 'left', width: 55, height: 20});
        doc.fontSize(8).text(data.trabajos[j].descripcion, 100, space,{align: 'left', width: 210, height: 20} );
        doc.fontSize(9).text(data.trabajos[j].unidad_medida,330, space,{align:'center', width: 40} );       
        doc.fontSize(9).text(data.trabajos[j].cantidad_planificada,385,space,{align:'center', width: 50});
        doc.fontSize(9).text(data.trabajos[j].precio, 440,space,{align:'right', width: 60});
        //realiza operaciones entre los registros para mostrar cantidades 
        importe = data.trabajos[j].cantidad_planificada * data.trabajos[j].precio;
        importe_parcial = importe_parcial + data.trabajos[j].importe;
        //muestrame el importe con solo dos numeros despues del . .
        doc.fontSize(9).text(importe.toFixed(2), 510, space,{align:'right', width: 60, toFixed:2});
        //incrementa en 20 el salto de linea en cada iteracion
        space = space + 20; 
      }

      iva = importe_parcial * 0.16;
      pago_total = importe_parcial + iva;
      doc.fontSize(9).text("IMPORTE PARCIAL:", 415, 630)
      doc.fontSize(9).text(importe_parcial.toFixed(2), 0, 630,{align: 'right'});
      doc.fontSize(9).text("IVA 16%:", 462, 640)
      doc.fontSize(9).text(iva.toFixed(2), 0, 640,{align: 'right'});
      doc.fontSize(9).text("PAGO TOTAL:", 440, 650)
      doc.fontSize(10).text(pago_total.toFixed(2), 0,650,{align: 'right'});


      doc.fontSize(10).text("FIRMAS PROCISA", 100, 650);
      doc.fontSize(9).text("CONSTRUCTOR", 85,705);
      doc.fontSize(9).text("LIQUIDADOR", 270,705);
      doc.fontSize(9).text("SUPERINTENDENTE",435,705);


      doc.fontSize(7).text("NOMBRE, FIRMA Y FECHA", 80,745);
      doc.fontSize(7).text("NOMBRE, FIRMA Y FECHA", 255,745);
      doc.fontSize(7).text("NOMBRE, FIRMA Y FECHA",435,745);
      doc.fontSize(9).text(data.superintendente, 380, 730, {align:'center', width: 200, height:10});
      doc.fontSize(9).text(data.contratista, 40, 730, {align:'center', width: 180, height:10});
      doc.end();      
    });
    //esperame 1000 segundos para hacer la busqueda y mostrar el resultado
    setTimeout(function(){
      res.redirect('/output.pdf');    
    }, 1000);     
  });






// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
