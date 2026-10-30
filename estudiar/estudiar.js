/* ═══ UApp · Estudiar: tarjetas con semáforo y selección múltiple ═══
   Archivo propio de la sección (desde la v2.6.1). Sus estilos están en estudiar/estudiar.css.
   · El contenido de cada ramo vive en estudiar/mazos/<id>.json y se descarga recién cuando el
     estudiante lo abre. Queda guardado en su teléfono (caché «uapp-recursos») y funciona sin conexión.
   · Aquí va solo el índice (INDICE): los códigos de tarjetas y preguntas, sus temas y algunos conteos,
     para que Inicio, las líneas y los ramos muestren el avance sin descargar el contenido.
     Lo escribe _desarrollo/versionar.py a partir de los mazos: no se edita a mano.
   · El progreso de cada estudiante sigue en su teléfono (localStorage «uapp_estudio_v1»).
   Repaso espaciado: verde = vuelve en cada vez más días; amarillo = vuelve pronto;
   rojo = vuelve en la misma sesión y mañana. */
(function(){
  var CLAVE="uapp_estudio_v1", NUEVAS_DEF=20, OPCIONES=[10,20,30,0], MAX_SESION=100, PREG_SESION=10;   /* 0 = todas */

  /* ÍNDICE: lo escribe _desarrollo/versionar.py a partir de estudiar/mazos/*.json. No editar a mano. */
  var INDICE={
    "acto-juridico":{"v":"a8bbedd67f21","ramo":"Acto Jurídico","nota":"Contenido inicial basado en el Código Civil y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":22,"t":"aj01,aj02,aj03,aj04,aj05,aj06,aj07,aj08,aj09,aj10,aj11,aj12,aj13,aj14,aj15,aj16,aj17,aj18,aj19,aj20,aj21,aj22,aj23,aj24,aj25,aj26,aj27,aj28,aj29,aj30","p":"ap01,ap02,ap03,ap04,ap05,ap06,ap07,ap08,ap09,ap10,ap11,ap12,ap13,ap14"},
    "historia-instituciones":{"v":"05213d59f611","ramo":"Historia y Ev. de las Instituciones Civiles","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":0,"t":"hi01,hi02,hi03,hi04,hi05,hi06,hi07,hi08,hi09,hi10,hi11,hi12,hi13,hi14,hi15,hi16","p":"hp01,hp02,hp03,hp04,hp05,hp06,hp07,hp08"},
    "teoria-ley-personas":{"v":"4f00bb68c961","ramo":"Teoría de la Ley y las Personas","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":16,"t":"tl01,tl02,tl03,tl04,tl05,tl06,tl07,tl08,tl09,tl10,tl11,tl12,tl13,tl14,tl15,tl16","p":"tlp1,tlp2,tlp3,tlp4,tlp5,tlp6,tlp7,tlp8"},
    "bienes":{"v":"516f22490011","ramo":"Bienes","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":15,"t":"bi01,bi02,bi03,bi04,bi05,bi06,bi07,bi08,bi09,bi10,bi11,bi12,bi13,bi14,bi15,bi16","p":"bip1,bip2,bip3,bip4,bip5,bip6,bip7,bip8"},
    "teoria-obligaciones":{"v":"6bfe4a43bdf1","ramo":"Teoría de las Obligaciones","nota":"Elaborado a partir de los apuntes del curso 2026, más un apunte complementario sobre prescripción extintiva, y ordenado por temas: cada tarjeta y cada pregunta indican el suyo. Si encuentras un error, avísale al Centro de Estudiantes.","temas":[{"n":1,"t":"Concepto y fuentes de las obligaciones"},{"n":2,"t":"Modalidades: la condición"},{"n":3,"t":"Modalidades: plazo y modo"},{"n":4,"t":"Obligaciones de dar, hacer y no hacer"},{"n":5,"t":"Obligaciones mancomunadas"},{"n":6,"t":"Solidaridad y solidaridad activa"},{"n":7,"t":"Solidaridad pasiva"},{"n":8,"t":"Obligaciones indivisibles"},{"n":9,"t":"Obligaciones naturales"},{"n":10,"t":"Efectos de las obligaciones e indemnización"},{"n":11,"t":"Cláusula penal y derechos auxiliares"},{"n":12,"t":"Prescripción extintiva"}],"art":203,"t":"o01t01,o01t02,o01t03,o01t04,o01t05,o01t06,o01t07,o01t08,o01t09,o01t10,o01t11,o01t12,o01t13,o01t14,o01t15,o01t16,o01t17,o01t18,o01t19,o01t20,o01t21,o02t01,o02t02,o02t03,o02t04,o02t05,o02t06,o02t07,o02t08,o02t09,o02t10,o02t11,o02t12,o02t13,o02t14,o02t15,o02t16,o02t17,o02t18,o02t19,o02t20,o02t21,o03t01,o03t02,o03t03,o03t04,o03t05,o03t06,o03t07,o03t08,o03t09,o03t10,o03t11,o03t12,o03t13,o03t14,o03t15,o03t16,o03t17,o03t18,o03t19,o03t20,o03t21,o03t22,o03t23,o03t24,o03t25,o04t01,o04t02,o04t03,o04t05,o04t06,o04t07,o04t08,o04t09,o04t10,o04t11,o04t12,o04t13,o04t15,o04t16,o04t17,o04t18,o04t19,o04t20,o04t21,o04t22,o04t23,o04t24,o04t25,o05t01,o05t03,o05t04,o05t05,o05t06,o05t07,o05t08,o05t09,o05t10,o05t11,o05t12,o05t13,o05t15,o05t16,o05t17,o05t18,o05t19,o05t20,o05t21,o05t22,o05t23,o06t01,o06t02,o06t03,o06t04,o06t05,o06t06,o06t07,o06t08,o06t09,o06t10,o06t11,o06t12,o06t13,o06t14,o06t15,o06t16,o06t17,o06t18,o06t19,o06t20,o07t01,o07t02,o07t03,o07t04,o07t05,o07t06,o07t07,o07t08,o07t10,o07t11,o07t12,o07t13,o07t14,o07t15,o07t16,o07t17,o07t18,o07t19,o07t20,o08t01,o08t02,o08t03,o08t04,o08t05,o08t06,o08t07,o08t08,o08t09,o08t10,o08t11,o08t12,o08t13,o08t14,o08t15,o08t16,o08t17,o08t18,o08t19,o08t20,o08t21,o09t01,o09t02,o09t03,o09t04,o09t05,o09t06,o09t07,o09t08,o09t10,o09t11,o09t12,o09t13,o09t14,o09t15,o09t16,o09t17,o09t18,o09t19,o10t01,o10t02,o10t03,o10t04,o10t06,o10t07,o10t08,o10t09,o10t10,o10t11,o10t12,o10t13,o10t14,o10t15,o10t16,o10t17,o10t18,o10t19,o10t20,o10t21,o10t22,o10t23,o10t24,o10t25,o11t01,o11t02,o11t03,o11t04,o11t05,o11t06,o11t07,o11t08,o11t09,o11t10,o11t11,o11t12,o11t13,o11t14,o11t15,o11t16,o11t17,o11t18,o11t19,o12t01,o12t02,o12t03,o12t04,o12t05,o12t06,o12t07,o12t08,o12t09,o12t10,o12t11,o12t12,o12t13,o12t14,o12t15,o12t16,o13t01,o13t02,o13t04,o13t05,o13t06,o13t07,o13t08,o13t09,o13t10,o13t11,o13t12,o13t13,o13t14,o13t15,o13t16,o13t17,o13t18,o13t19,o13t21,o13t22,o14t02,o14t03,o14t04,o14t05,o14t06,o14t07,o14t08,o14t09,o14t10,o14t11,o14t12,o14t13,o14t14,o14t15,o14t16,o14t17,o14t18,o14t19,o14t20,o14t21,o14t22,o14t23,o14t24,o15t01,o15t02,o15t03,o15t04,o15t05,o15t06,o15t07,o15t08,o15t09,o15t10,o15t11,o15t12,o15t13,o15t14,o15t15,o16t01,o16t02,o16t03,o16t04,o16t05,o16t06,o16t07,o16t08,o16t09,o16t11,o16t12,o16t14,o16t15,o16t16,o16t18,o16t19,o16t20,o16t21,o17t01,o17t02,o17t03,o17t04,o17t05,o17t06,o17t07,o17t08,o17t09,o17t10,o17t11,o17t12,o17t13,o17t14,o17t15,o17t16,o18t01,o18t02,o18t03,o18t04,o18t05,o18t06,o18t07,o18t08,o18t09,o18t10,o18t11,o18t12,o18t13,o18t14,o18t15,o19t01,o19t02,o19t03,o19t04,o19t05,o19t06,o19t07,o19t08,o19t09,o19t10,o19t11,o19t12,o19t13,o19t14,o19t15,o19t16,o19t17,o19t18,o19t19,o19t20,o19t21,o20t01,o20t02,o20t03,o20t04,o20t05,o20t06,o20t07,o20t08,o20t09,o20t10,o20t11,o20t12,o20t13,o20t14,o20t15,o20t16,o20t17,o20t18,o20t19,o20t20,o21t01,o21t02,o21t03,o21t04,o21t05,o21t06,o21t07,o21t08,o21t09,o21t10,o21t11,o21t12,o21t13,o21t14,o21t15,o21t16,o21t17,o21t18,o21t19,o21t20,o21t21,o22t01,o22t02,o22t03,o22t04,o22t05,o22t06,o22t07,o22t08,o22t09,o22t10,o22t11,o22t12,o22t13,o22t14,o22t15,o22t16,o22t17,o22t18,o22t19,o22t20,o22t21,o23t01,o23t02,o23t03,o23t04,o23t05,o23t06,o23t07,o23t08,o23t09,o23t10,o23t11,o23t12,o23t13,o23t14,o23t15,o23t16,o23t17,o23t18,o23t19,o23t20,o23t21,o23t22,o23t23,o23t24,o23t25,o24t01,o24t02,o24t03,o24t04,o24t05,o24t06,o24t07,o24t08,o24t09,o24t10,o24t11,o24t12,o24t13,o24t14,o24t15,o24t16,o24t17,o24t18,o24t19,o24t20,o24t21,o24t22,o24t23,o24t24,o25t01,o25t02,o25t03,o25t04,o25t05,o25t06,o25t07,o25t08,o25t09,o25t11,o25t12,o25t14,o25t15,o25t16,o25t17,o25t18,o25t19,o25t20,o25t21,o25t22,o25t23,o26t01,o26t02,o26t03,o26t04,o26t05,o26t06,o26t08,o26t09,o26t10,o26t11,o26t12,o26t13,o26t14,o26t15,o26t16,o26t17,o26t18,o26t19,o26t20,o26t21,o26t22,o26t23,o26t24,o27t01,o27t02,o27t03,o27t04,o27t05,o27t06,o27t07,o27t08,o27t09,o27t10,o27t11,o27t12,o27t13,o27t14,o27t15,o27t16,o27t17,o27t18,o27t19,o27t20,o27t21,o27t22,o27t23,o27t24,o27t25,o29t01,o29t02,o29t03,o29t04,o29t05,o29t06,o29t07,o29t08,o29t09,o29t10,o29t11,o29t12,o29t13,o29t14,o29t15,o29t16,o29t17,o29t18,o29t19,o29t20,o29t21,o29t22,o29t23,o29t25,o30t01,o30t02,o30t03,o30t04,o30t05,o30t06,o30t07,o30t08,o30t09,o30t10,o30t11,o30t12,o30t14,o30t15,o30t16,o30t17,o30t18,o30t19,o30t20,o30t21,o30t23,o30t24,o32t01,o32t02,o32t03,o32t04,o32t05,o32t06,o32t07,o32t08,o32t09,o32t10,o32t11,o32t12,o32t13,o32t14,o32t15,o32t16,o32t17,o32t18,o32t19,o32t20,o32t21,o32t22,o32t23,o32t24,o32t25","tu":"1*75,2*123,3*28,4*35,5*13,6*17,7,6*8,7*96,8*48,9*29,10*94,11*35,12*25","p":"o01p01,o01p02,o01p03,o01p04,o01p05,o02p01,o02p02,o02p03,o02p04,o02p05,o02p06,o03p01,o03p02,o03p03,o03p04,o03p05,o03p06,o04p01,o04p02,o04p03,o04p04,o04p05,o04p06,o05p01,o05p02,o05p03,o05p04,o05p05,o05p06,o06p01,o06p02,o06p03,o06p04,o06p05,o07p01,o07p02,o07p03,o07p04,o07p05,o08p01,o08p02,o08p03,o08p04,o08p05,o08p06,o09p01,o09p02,o09p03,o09p04,o09p05,o10p01,o10p02,o10p03,o10p04,o10p05,o10p06,o11p01,o11p02,o11p03,o11p04,o11p05,o12p01,o12p02,o12p03,o12p04,o12p05,o13p01,o13p02,o13p03,o13p04,o13p05,o13p06,o14p01,o14p02,o14p03,o14p04,o14p05,o14p06,o15p01,o15p02,o15p03,o15p04,o15p05,o16p01,o16p02,o16p03,o16p04,o16p05,o16p06,o17p01,o17p02,o17p03,o17p04,o17p05,o17p06,o18p01,o18p02,o18p03,o18p04,o18p05,o18p06,o19p01,o19p02,o19p03,o19p04,o19p05,o19p06,o20p01,o20p02,o20p03,o20p04,o20p05,o20p06,o21p01,o21p02,o21p03,o21p04,o21p05,o22p01,o22p02,o22p03,o22p04,o22p05,o23p01,o23p02,o23p03,o23p04,o23p05,o23p06,o24p01,o24p02,o24p03,o24p04,o24p05,o24p06,o25p01,o25p02,o25p03,o25p04,o25p05,o25p06,o26p01,o26p02,o26p03,o26p04,o26p05,o26p06,o27p01,o27p02,o27p03,o27p04,o27p05,o27p06,o29p01,o29p02,o29p03,o29p04,o29p05,o29p06,o30p01,o30p02,o30p03,o30p04,o30p05,o30p06,o32p01,o32p02,o32p03,o32p04,o32p05,o32p06","pu":"1*19,2*33,3*3,2,3*3,4,3,4*8,5*2,4,6*2,5,6*6,7*32,8*10,9,8*2,9*3,10,9*2,10*2,9,10*19,11,10*2,11*8,12*6"},
    "fuentes-obligaciones":{"v":"42847eb3d7f2","ramo":"Fuentes de las Obligaciones","nota":"Elaborado a partir de los apuntes del curso 2026 y ordenado por temas: cada tarjeta y cada pregunta indican el suyo. Si encuentras un error, avísale al Centro de Estudiantes.","temas":[{"n":1,"t":"Principios y clasificación de los contratos"},{"n":2,"t":"Efectos e interpretación del contrato"},{"n":3,"t":"Contrato de promesa"},{"n":4,"t":"Compraventa: formación, precio y cosa ajena"},{"n":5,"t":"Compraventa: obligaciones de las partes"},{"n":6,"t":"Compraventa: lesión enorme"},{"n":7,"t":"Mandato"},{"n":8,"t":"Hipoteca"}],"art":162,"t":"f01t01,f01t02,f01t03,f01t04,f01t05,f01t06,f01t07,f01t08,f01t09,f01t10,f01t11,f01t12,f01t13,f01t14,f01t15,f01t16,f01t17,f01t18,f01t19,f01t20,f01t22,f02t01,f02t02,f02t03,f02t04,f02t05,f02t06,f02t07,f02t08,f02t09,f02t10,f02t11,f02t12,f02t13,f02t14,f02t15,f02t16,f02t17,f02t18,f02t19,f02t20,f02t21,f02t22,f02t23,f02t24,f02t25,f03t01,f03t02,f03t03,f03t04,f03t05,f03t06,f03t07,f03t08,f03t09,f03t10,f03t11,f03t12,f03t13,f03t14,f03t15,f03t16,f03t17,f03t18,f03t19,f03t20,f03t21,f03t22,f03t23,f03t24,f03t25,f04t01,f04t02,f04t03,f04t04,f04t05,f04t06,f04t07,f04t08,f04t09,f04t10,f04t11,f04t12,f04t13,f04t14,f04t15,f04t16,f04t17,f04t18,f04t19,f04t20,f04t21,f05t01,f05t02,f05t03,f05t04,f05t05,f05t06,f05t07,f05t08,f05t09,f05t10,f05t11,f05t12,f05t13,f05t14,f05t15,f05t16,f05t17,f05t18,f05t19,f05t20,f05t21,f05t22,f05t23,f05t24,f05t25,f05t26,f05t27,f05t28,f05t29,f05t30,f05t31,f06t01,f06t02,f06t03,f06t04,f06t05,f06t06,f06t07,f06t08,f06t09,f06t10,f06t11,f06t12,f06t13,f06t14,f06t15,f06t16,f06t17,f06t18,f06t19,f06t20,f07t01,f07t02,f07t03,f07t04,f07t05,f07t06,f07t07,f07t08,f07t09,f07t10,f07t11,f07t12,f07t14,f07t15,f07t16,f07t17,f07t18,f07t19,f07t20,f08t01,f08t02,f08t03,f08t04,f08t05,f08t06,f08t07,f08t08,f08t09,f08t10,f08t11,f08t12,f08t13,f08t14,f08t15,f08t16,f09t02,f09t03,f09t04,f09t05,f09t07,f09t08,f09t09,f09t10,f09t11,f09t12,f09t13,f09t14,f09t15,f09t16,f10t01,f10t02,f10t03,f10t04,f10t05,f10t06,f10t07,f10t08,f10t09,f10t10,f10t11,f10t12,f10t13,f10t14,f10t15,f10t16,f10t17,f10t18,f10t20,f11t01,f11t02,f11t03,f11t04,f11t05,f11t06,f11t07,f11t08,f11t09,f11t10,f11t11,f11t12,f11t13,f11t14,f11t15,f11t16,f11t17,f11t18,f11t19,f11t20,f12t01,f12t02,f12t03,f12t04,f12t05,f12t06,f12t07,f12t08,f12t09,f12t10,f12t11,f12t12,f12t13,f12t14,f12t15,f12t16,f12t18,f12t19,f12t20,f13t01,f13t02,f13t03,f13t04,f13t05,f13t06,f13t07,f13t08,f13t09,f13t10,f13t11,f13t12,f13t13,f13t14,f13t15,f13t16,f13t17,f13t18,f13t19,f13t20,f14t01,f14t02,f14t03,f14t04,f14t05,f14t06,f14t07,f14t08,f14t09,f14t10,f14t11,f14t12,f14t13,f14t14,f14t15,f14t16,f14t18,f14t19,f14t20,f15t01,f15t02,f15t03,f15t04,f15t05,f15t06,f15t07,f15t08,f15t09,f15t10,f15t11,f15t12,f15t13,f15t14,f15t15,f15t16,f15t17,f15t18,f15t19,f15t20,f16t01,f16t02,f16t03,f16t04,f16t05,f16t06,f16t07,f16t08,f16t09,f16t10,f16t11,f16t12,f16t13,f16t14,f16t15,f16t16,f16t17,f16t18,f16t19,f16t20,f17t01,f17t02,f17t03,f17t04,f17t05,f17t06,f17t07,f17t08,f17t09,f17t10,f17t11,f17t12,f17t13,f17t14,f17t15,f17t16,f17t17,f17t18,f17t19,f17t20,f17t21,f17t22,f17t23,f17t24,f17t25,f17t26,f17t27,f17t28,f17t29,f17t30,f17t31,f18t01,f18t02,f18t03,f18t04,f18t05,f18t06,f18t07,f18t08,f18t09,f18t10,f18t11,f18t12,f18t13,f18t14,f18t15,f18t16,f18t17,f18t18,f18t19,f18t20,f19t01,f19t02,f19t04,f19t05,f19t06,f19t07,f19t08,f19t09,f19t11,f19t12,f19t13,f19t14,f19t15,f19t16,f19t17,f19t18,f19t19,f19t20,f20t01,f20t02,f20t04,f20t05,f20t06,f20t07,f20t08,f20t09,f20t10,f20t11,f20t12,f20t13,f20t14,f20t15,f20t16,f20t17,f20t18,f20t19,f20t20,f21t01,f21t02,f21t03,f21t04,f21t05,f21t06,f21t07,f21t08,f21t09,f21t10,f21t11,f21t12,f21t13,f21t14,f21t15,f21t16,f21t17,f21t18,f21t19,f21t20,f22t01,f22t02,f22t03,f22t04,f22t05,f22t06,f22t07,f22t08,f22t09,f22t10,f22t11,f22t12,f22t13,f22t14,f22t15,f22t16,f22t17,f22t18,f22t19,f22t20,f23t01,f23t02,f23t03,f23t04,f23t05,f23t06,f23t07,f23t08,f23t09,f23t10,f23t11,f23t12,f23t13,f23t14,f23t15,f23t16,f23t17,f23t18,f23t19,f24t01,f24t02,f24t03,f24t04,f24t05,f24t06,f24t07,f24t08,f24t09,f24t10,f24t11,f24t12,f24t13,f24t14,f24t15,f24t16,f24t17,f24t18,f24t19,f24t20,f25t01,f25t02,f25t03,f25t04,f25t05,f25t06,f25t07,f25t08,f25t09,f25t10,f25t11,f25t12,f25t13,f25t14,f25t15,f25t16,f25t17,f25t18,f25t19,f25t20,f26t01,f26t02,f26t03,f26t04,f26t05,f26t06,f26t07,f26t08,f26t09,f26t10,f26t11,f26t12,f26t13,f26t14,f26t15,f26t16,f26t17,f26t18,f26t19,f26t20","tu":"1*92,2*51,3*107,4*59,5*71,6*18,7*73,8*65","p":"f01p01,f01p02,f01p03,f01p04,f01p05,f02p01,f02p02,f02p03,f02p04,f02p05,f03p01,f03p02,f03p03,f03p04,f03p05,f04p01,f04p02,f04p03,f04p04,f04p05,f05p01,f05p02,f05p03,f05p04,f05p05,f06p01,f06p02,f06p03,f06p04,f06p05,f07p01,f07p02,f07p03,f07p04,f07p05,f08p01,f08p02,f08p03,f08p04,f08p05,f09p01,f09p02,f09p03,f09p04,f09p05,f10p01,f10p02,f10p03,f10p04,f10p05,f11p01,f11p02,f11p03,f11p04,f11p05,f12p01,f12p02,f12p03,f12p04,f12p05,f13p01,f13p02,f13p03,f13p04,f13p05,f14p01,f14p02,f14p03,f14p04,f15p01,f15p02,f15p03,f15p04,f15p05,f16p01,f16p02,f16p03,f16p04,f16p05,f17p01,f17p02,f17p03,f17p04,f17p05,f17p06,f18p01,f18p02,f18p03,f18p04,f18p05,f19p01,f19p02,f19p03,f19p04,f19p05,f20p01,f20p02,f20p03,f20p04,f20p05,f21p01,f21p02,f21p03,f21p04,f21p05,f22p01,f22p02,f22p03,f22p04,f22p05,f23p01,f23p02,f23p03,f23p04,f23p05,f24p01,f24p02,f24p03,f24p04,f24p05,f25p01,f25p02,f25p03,f25p04,f25p05,f26p01,f26p02,f26p03,f26p04,f26p05","pu":"1*20,2*10,3*30,4*14,5*16,6*5,7*19,8*16"},
    "derecho-familia":{"v":"617fe490f3f7","ramo":"Derecho de Familia","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":10,"t":"df01,df02,df03,df04,df05,df06,df07,df08,df09,df10,df11,df12,df13,df14,df15,df16","p":"dfp1,dfp2,dfp3,dfp4,dfp5,dfp6,dfp7,dfp8"},
    "responsabilidad-civil":{"v":"a48c5f0150a6","ramo":"Responsabilidad Civil","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":12,"t":"rc01,rc02,rc03,rc04,rc05,rc06,rc07,rc08,rc09,rc10,rc11,rc12,rc13,rc14,rc15,rc16","p":"rcp1,rcp2,rcp3,rcp4,rcp5,rcp6,rcp7,rcp8"},
    "derecho-sucesorio":{"v":"07aae15be6eb","ramo":"Derecho Sucesorio","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":14,"t":"ds01,ds02,ds03,ds04,ds05,ds06,ds07,ds08,ds09,ds10,ds11,ds12,ds13,ds14,ds15,ds16","p":"dsp1,dsp2,dsp3,dsp4,dsp5,dsp6,dsp7,dsp8"},
    "organizacion-tribunales":{"v":"63bf083cbc13","ramo":"Organización y Atribuciones de los Tribunales","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":16,"t":"ot01,ot02,ot03,ot04,ot05,ot06,ot07,ot08,ot09,ot10,ot11,ot12,ot13,ot14,ot15,ot16","p":"otp1,otp2,otp3,otp4,otp5,otp6,otp7,otp8"},
    "teoria-proceso":{"v":"806a773deaec","ramo":"Teoría del Proceso","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":8,"t":"pr01,pr02,pr03,pr04,pr05,pr06,pr07,pr08,pr09,pr10,pr11,pr12,pr13,pr14,pr15,pr16","p":"prp1,prp2,prp3,prp4,prp5,prp6,prp7,prp8"},
    "procedimientos-cognicion":{"v":"695c7c4ea2a9","ramo":"Procedimientos Civiles de Cognición","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":15,"t":"cg01,cg02,cg03,cg04,cg05,cg06,cg07,cg08,cg09,cg10,cg11,cg12,cg13,cg14,cg15,cg16","p":"cgp1,cgp2,cgp3,cgp4,cgp5,cgp6,cgp7,cgp8"},
    "ejecucion-cautela":{"v":"5dfa8d7e14f3","ramo":"Procedimientos de Ejecución y Cautela","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":11,"t":"ec01,ec02,ec03,ec04,ec05,ec06,ec07,ec08,ec09,ec10,ec11,ec12,ec13,ec14,ec15,ec16","p":"ecp1,ecp2,ecp3,ecp4,ecp5,ecp6,ecp7,ecp8"},
    "procesal-penal":{"v":"15b26139462a","ramo":"Derecho Procesal Penal","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":16,"t":"pp01,pp02,pp03,pp04,pp05,pp06,pp07,pp08,pp09,pp10,pp11,pp12,pp13,pp14,pp15,pp16","p":"ppp1,ppp2,ppp3,ppp4,ppp5,ppp6,ppp7,ppp8"},
    "procedimientos-orales":{"v":"abe1a86527f3","ramo":"Procedimientos Especiales Orales","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":5,"t":"eo01,eo02,eo03,eo04,eo05,eo06,eo07,eo08,eo09,eo10,eo11,eo12,eo13,eo14,eo15,eo16","p":"eop1,eop2,eop3,eop4,eop5,eop6,eop7,eop8"},
    "reorganizacion-liquidacion":{"v":"534821ef3ce9","ramo":"Reorg. y Liquidación Patrimonial","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":0,"t":"rl01,rl02,rl03,rl04,rl05,rl06,rl07,rl08,rl09,rl10,rl11,rl12,rl13,rl14,rl15,rl16","p":"rlp1,rlp2,rlp3,rlp4,rlp5,rlp6,rlp7,rlp8"},
    "recursos":{"v":"427ef10c95a3","ramo":"Recursos","nota":"Contenido inicial basado en la legislación vigente y la doctrina nacional. Si encuentras un error, avísale al Centro de Estudiantes.","art":10,"t":"re01,re02,re03,re04,re05,re06,re07,re08,re09,re10,re11,re12,re13,re14,re15,re16","p":"rep1,rep2,rep3,rep4,rep5,rep6,rep7,rep8"}
  };
  /* FIN ÍNDICE */

  /* ── mazos: primero el esqueleto del índice; el contenido llega al abrir cada ramo ── */
  var RUTA="estudiar/mazos/", RECURSOS="uapp-recursos";
  var MAZOS={}, LISTOS={}, CARGANDO={};
  /* «1*3,2*2» → [1,1,1,2,2]; una celda vacía es una tarjeta sin tema */
  function desplegar(s){ var out=[]; if(!s) return out; String(s).split(",").forEach(function(x){ var p=x.split("*"), n=p.length>1?+p[1]:1; for(var i=0;i<n;i++) out.push(p[0]===""?null:+p[0]); }); return out; }
  function esqueleto(x){
    function items(ids,us){ return (ids?String(ids).split(","):[]).map(function(id,i){ var o={id:id}; if(us[i]!=null) o.u=us[i]; return o; }); }
    var M={ramo:x.ramo,nota:x.nota,revision:x.revision||null,art:x.art||0,tarjetas:items(x.t,desplegar(x.tu)),preguntas:items(x.p,desplegar(x.pu))};
    if(x.temas) M.temas=x.temas;
    return M;
  }
  for(var _k in INDICE) MAZOS[_k]=esqueleto(INDICE[_k]);
  function urlMazo(m){ return RUTA+m+".json?v="+INDICE[m].v; }
  /* lo guardado en el teléfono primero; si no está, de internet (y se guarda) */
  function deCache(url){
    try{ if(!window.caches||!caches.open) return Promise.resolve(null);
      return caches.open(RECURSOS).then(function(c){ return c.match(url); }).then(function(r){ return r||null; },function(){ return null; });
    }catch(e){ return Promise.resolve(null); }
  }
  function aCache(url,resp){ try{ if(window.caches&&caches.open) caches.open(RECURSOS).then(function(c){ return c.put(url,resp); }).catch(function(){}); }catch(e){} }
  function deRed(url){ return fetch(url).then(function(r){ if(!r.ok) throw new Error("HTTP "+r.status); aCache(url,r.clone()); return r.json(); }); }
  function traer(url){
    return deCache(url).then(function(hit){
      if(!hit) return deRed(url);
      return hit.json().catch(function(){ return deRed(url); });   /* copia dañada: se vuelve a descargar */
    });
  }
  function cargarMazo(m){
    if(LISTOS[m]) return Promise.resolve(MAZOS[m]);
    if(!INDICE[m]) return Promise.reject(new Error("Mazo desconocido: "+m));
    if(CARGANDO[m]) return CARGANDO[m];
    var p=traer(urlMazo(m)).then(function(M){
      if(!M||!Array.isArray(M.tarjetas)||!Array.isArray(M.preguntas)) throw new Error("Mazo incompleto: "+m);
      M.art=INDICE[m].art||0; MAZOS[m]=M; LISTOS[m]=true; delete CARGANDO[m]; return M;
    },function(e){ delete CARGANDO[m]; throw e; });
    CARGANDO[m]=p; return p;
  }
  /* los ramos que el estudiante ya empezó se guardan solos para estudiar sin conexión;
     las versiones viejas de los mazos se borran del teléfono */
  function guardarEmpezados(){
    var pend=[]; for(var m in MAZOS){ if(empezado(m)) pend.push(m); }
    (function sig(){
      var x=pend.shift(); if(!x) return; var url=urlMazo(x);
      deCache(url).then(function(hit){ if(!hit) return fetch(url).then(function(r){ if(r.ok) aCache(url,r); }); }).catch(function(){}).then(sig);
    })();
    try{
      if(!window.caches||!caches.open) return;
      var vig={}; for(var k in INDICE) vig[new URL(urlMazo(k),location.href).href]=1;
      caches.open(RECURSOS).then(function(c){ return c.keys().then(function(ks){ ks.forEach(function(rq){ if(rq.url.indexOf("/"+RUTA)>=0&&!vig[rq.url]) c.delete(rq); }); }); }).catch(function(){});
    }catch(e){}
  }
  /* Estudiar parte eligiendo una línea de la carrera; cada línea reúne una o más áreas de la malla */
  var LINEAS=[
    {id:"civil",nombre:"Civil",titulo:"Línea civil",areas:["Civil"],color:"var(--civil)"},
    {id:"procesal",nombre:"Procesal",titulo:"Línea procesal",areas:["Procesal"],color:"var(--proc)"},
    {id:"constitucional",nombre:"Constitucional",titulo:"Línea constitucional",areas:["Constitucional"],color:"#0F7B6C"},
    {id:"penal",nombre:"Penal",titulo:"Línea penal",areas:["Penal"],color:"var(--penal)"},
    {id:"comercial",nombre:"Comercial",titulo:"Línea comercial",areas:["Comercial"],color:"#B7791F"},
    {id:"laboral",nombre:"Laboral",titulo:"Línea laboral",areas:["Laboral"],color:"#2F855A"},
    {id:"administrativo",nombre:"Administrativo",titulo:"Línea administrativa",areas:["Administrativo"],color:"#8B5E3C"},
    {id:"economico",nombre:"Económico y tributario",titulo:"Línea económica y tributaria",areas:["Económico","Tributario"],color:"#C05621"},
    {id:"fundamentos",nombre:"Historia y fundamentos",titulo:"Historia y fundamentos",areas:["Histórico","Fundamentos"],color:"#64748B"}
  ];

  /* ── utilidades ── */
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function norm(s){ return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim(); }
  /* el plan no ajustado nombra algunos ramos distinto: «(Ev. Ciclo)» al final o «Reorganización» completo */
  function nombreRamo(s){ return norm(String(s||"").replace(/\([^)]*\)/g," ")).replace(/\breorg\b/g,"reorganizacion"); }
  function mazoDe(ramo){ var n=nombreRamo(ramo); for(var m in MAZOS){ if(nombreRamo(MAZOS[m].ramo)===n) return m; } return null; }
  function dia(d){ d=d||new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
  function mas(f,n){ var p=f.split("-"), d=new Date(+p[0],+p[1]-1,+p[2]); d.setDate(d.getDate()+n); return dia(d); }
  function mezclar(a){ for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)), x=a[i]; a[i]=a[j]; a[j]=x; } return a; }
  function plural(n,s,p){ return n+" "+(n===1?s:p); }
  /* una fuente del Código Civil enlaza al texto vigente en LeyChile (BCN) */
  var CODIGOS={CC:{n:"Código Civil",id:172986},CPC:{n:"Código de Procedimiento Civil",id:22740},COT:{n:"Código Orgánico de Tribunales",id:25563},
               CPP:{n:"Código Procesal Penal",id:176595},CT:{n:"Código del Trabajo",id:207436}};
  function fuente(r){ var m=String(r).match(/\b(CC|CPC|COT|CPP|CT)\b/), C=m?CODIGOS[m[1]]:null;
    return C
    ? '<a class="es-ref" href="https://www.bcn.cl/leychile/navegar?idNorma='+C.id+'" target="_blank" rel="noopener" aria-label="'+esc(r)+', ver el '+C.n+' en LeyChile">'+esc(r)+' ↗</a>'
    : '<span class="es-ref">'+esc(r)+'</span>'; }
  /* tema: los mazos hechos desde los apuntes del curso se ordenan por temas, y cada tarjeta muestra el suyo */
  function tema(x){ var M=S&&MAZOS[S.m], T=M&&M.temas&&x&&x.u?M.temas[x.u-1]:null; return T?T.t:''; }
  function refs(x){ var t=tema(x); return t?'<div class="es-meta">'+fuente(x.r)+'<span class="es-tema">'+esc(t)+'</span></div>':fuente(x.r); }

  /* ── progreso guardado en el teléfono ── */
  function cargar(){ try{ var o=JSON.parse(localStorage.getItem(CLAVE)||"{}"); o.c=o.c||{}; o.h=o.h||{}; o.p=o.p||{}; o.n=o.n||{}; o.cfg=o.cfg||{}; o.r=Array.isArray(o.r)?o.r:[]; o.rep=o.rep||{}; return o; }catch(e){ return {c:{},h:{},p:{},n:{},cfg:{},r:[],rep:{}}; } }
  var E=cargar();
  function guardar(){ try{ localStorage.setItem(CLAVE,JSON.stringify(E)); }catch(e){} }
  /* registro de cada respuesta: [día, ramo, id, resultado]; tarjetas «v», «a» o «r», preguntas 1 o 0.
     Todavía no se muestra: sirve para que las estadísticas por tema tengan historia desde el primer día */
  var MAX_REGISTRO=4000;
  function anotar(m,id,x){ E.r.push([dia(),m,id,x]); if(E.r.length>MAX_REGISTRO) E.r=E.r.slice(-MAX_REGISTRO); }
  /* tarjetas nuevas por día: la elige cada estudiante (10, 20, 30 o todas) */
  function ajuste(){ var n=E.cfg&&E.cfg.nuevas; return (n===undefined||n===null)?NUEVAS_DEF:n; }
  function limite(){ var n=ajuste(); return n===0?Infinity:n; }
  function sinVer(m){ return MAZOS[m].tarjetas.filter(function(t){ return !E.c[clave(m,t.id)]; }).map(function(t){ return t.id; }); }
  function clave(m,id){ return m+"/"+id; }
  function hist(){ var h=dia(); E.h[h]=E.h[h]||{v:0,a:0,r:0,ok:0,tot:0}; return E.h[h]; }
  function empezado(m){ for(var x in E.c){ if(x.indexOf(m+"/")===0) return true; } return !!(E.p[m]&&E.p[m].int&&E.p[m].int.length); }

  /* repaso espaciado con tres respuestas */
  function calificar(m,id,color){
    var k=clave(m,id), s=E.c[k], hoy=dia();
    if(!s){ s={iv:0,ef:2.5,n:0,l:0}; E.n[hoy]=(E.n[hoy]||0)+1; }
    var falloHoy=(s.rh===hoy);   /* si hoy estuvo en rojo, acertarla en la misma sesión no basta: vuelve mañana */
    if(color==="v"){ s.iv=falloHoy?1:((s.iv===0)?3:Math.max(s.iv+1,Math.round(s.iv*s.ef))); if(!falloHoy) s.ef=Math.min(3,s.ef+0.05); }
    else if(color==="a"){ s.iv=falloHoy?1:Math.max(1,Math.round(s.iv*1.2)); s.ef=Math.max(1.3,s.ef-0.15); }
    else { s.iv=1; s.ef=Math.max(1.3,s.ef-0.2); s.l=(s.l||0)+1; s.rh=hoy; }
    s.n++; s.u=color; s.due=mas(hoy,s.iv); s.f=hoy;
    E.c[k]=s; hist()[color]++; anotar(m,id,color); guardar();
  }
  function resumen(m){
    var M=MAZOS[m], hoy=dia(), r={total:M.tarjetas.length,nuevas:0,repaso:0,dominadas:0,vencidas:0};
    M.tarjetas.forEach(function(t){ var s=E.c[clave(m,t.id)]; if(!s){ r.nuevas++; return; } if(s.u==="v"&&s.iv>=21) r.dominadas++; else r.repaso++; if(s.due<=hoy) r.vencidas++; });
    r.nuevasHoy=Math.min(Math.max(0,limite()-(E.n[hoy]||0)),r.nuevas);
    r.paraHoy=Math.min(MAX_SESION,r.vencidas+r.nuevasHoy);
    var p=(E.p[m]&&E.p[m].int)||[]; r.intentos=p.length;
    r.mejor=p.reduce(function(b,x){ return (!b||x.ok/x.tot>b.ok/b.tot)?x:b; },null);
    r.manana=M.tarjetas.filter(function(t){ var s=E.c[clave(m,t.id)]; return s&&s.due===mas(hoy,1); }).length;
    return r;
  }
  /* lo mismo, pero solo con las tarjetas y preguntas de los temas elegidos (f = números de tema) */
  function enTemas(x,f){ return !f||f.indexOf(x.u)>=0; }
  function resumenF(m,f){
    var M=MAZOS[m], hoy=dia(), r={total:0,nuevas:0,repaso:0,dominadas:0,vencidas:0,nP:0};
    M.tarjetas.forEach(function(t){ if(!enTemas(t,f)) return; r.total++; var s=E.c[clave(m,t.id)]; if(!s){ r.nuevas++; return; } if(s.u==="v"&&s.iv>=21) r.dominadas++; else r.repaso++; if(s.due<=hoy) r.vencidas++; });
    M.preguntas.forEach(function(q){ if(enTemas(q,f)) r.nP++; });
    r.vistas=r.total-r.nuevas;
    r.paraHoy=Math.min(MAX_SESION,r.vencidas+Math.min(Math.max(0,limite()-(E.n[hoy]||0)),r.nuevas));
    return r;
  }
  function sinVerF(m,f){ return MAZOS[m].tarjetas.filter(function(t){ return enTemas(t,f)&&!E.c[clave(m,t.id)]; }).length; }
  function pregsTema(m,f){ return MAZOS[m].preguntas.filter(function(q){ return enTemas(q,f); }); }
  function activo(f){ var x=E.h[f]; return !!x&&(x.v+x.a+x.r+x.tot)>0; }
  function racha(){ var d=dia(), n=0; if(!activo(d)) d=mas(d,-1); while(activo(d)){ n++; d=mas(d,-1); } return n; }

  /* ── estado de la pantalla ── */
  /* V.l: línea abierta; V.m: ramo abierto; V.vt: pantalla de temas del ramo; V.sel: temas elegidos por ramo.
     El foco automático solo ayuda a quien usa teclado */
  var V={m:null,l:null,vt:false,sel:{}}, S=null, teclado=false;
  function seleccion(m){ return V.sel[m]||(V.sel[m]=[]); }
  document.addEventListener("keydown",function(){ teclado=true; },true);
  document.addEventListener("pointerdown",function(){ teclado=false; },true);
  function registrar(t){ try{ if(typeof logInteraccion==="function") logInteraccion("estudio",t+": "+MAZOS[V.m].ramo); }catch(e){} }
  /* ESPERA: mientras se descarga el contenido de un ramo se muestra un aviso, y si no hay conexión se explica.
     fn es lo que el estudiante pidió (empezar tarjetas, preguntas…), y se hace apenas llega el contenido.
     Con una conexión que no responde, a los 20 s se avisa igual; si el contenido llega después, la sesión empieza sola */
  var ESPERA=null;
  function conMazo(m,fn){
    if(LISTOS[m]){ fn(); return; }
    var esta={m:m,fn:fn,error:false}; ESPERA=esta; S=null; pintar();
    var reloj=setTimeout(function(){ if(ESPERA===esta&&!esta.error){ esta.error=true; pintar(); } },(+window.__esperaMax)||20000);
    cargarMazo(m).then(function(){ clearTimeout(reloj); if(ESPERA===esta){ ESPERA=null; fn(); } },
                       function(){ clearTimeout(reloj); if(ESPERA===esta){ esta.error=true; pintar(); } });
  }
  function vistaEspera(){
    var M=MAZOS[ESPERA.m]||{}, ramo='<b>'+esc(M.ramo||"este ramo")+'</b>';
    if(!ESPERA.error) return '<div class="es-fin es-espera" role="status"><p class="es-etq">Cargando</p><p>Descargando las tarjetas de '+ramo+'…</p>'+
      '<div class="es-botones"><button type="button" class="es-btn2" data-es="espera-volver">Volver</button></div></div>';
    return '<div class="es-fin es-espera" role="alert"><p class="es-grande">Sin conexión</p><p>No se pudo descargar '+ramo+'. La primera vez que abres un ramo necesitas internet; después queda guardado en este teléfono y funciona sin conexión.</p>'+
      '<div class="es-botones"><button type="button" class="es-btn2 es-prim" data-es="reintentar">Reintentar</button><button type="button" class="es-btn2" data-es="espera-volver">Volver</button></div></div>';
  }
  /* f: temas elegidos en la pantalla de temas; sin f, todo el ramo */
  function iniciarTarjetas(m,modo,f){
    var M=MAZOS[m], hoy=dia(), venc=[], nuevas=[], cola, base=M.tarjetas.filter(function(t){ return enTemas(t,f); });
    base.forEach(function(t){ var s=E.c[clave(m,t.id)]; if(!s) nuevas.push(t.id); else if(s.due<=hoy) venc.push(t.id); });
    venc.sort(function(a,b){ return E.c[clave(m,a)].due.localeCompare(E.c[clave(m,b)].due); });
    if(modo==="mas") cola=nuevas.slice(0,10);   /* «Estudiar 10 nuevas más», sin tocar el ajuste diario */
    else {
      var cupo=Math.max(0,limite()-(E.n[hoy]||0));
      cola=venc.concat(nuevas.slice(0,cupo)).slice(0,MAX_SESION);
      if(!cola.length&&modo==="extra") cola=mezclar(base.map(function(t){ return t.id; })).slice(0,10);
    }
    S={tipo:"t",m:m,cola:cola,i:0,vista:false,res:{v:0,a:0,r:0},f:f||null,rep:null,repOk:null};
    registrar(f?"tarjetas por tema":"tarjetas"); pintar();
  }
  function tarjeta(m,id){ return MAZOS[m].tarjetas.filter(function(t){ return t.id===id; })[0]; }
  function pregunta(m,id){ var L=(S&&S.pregs)||MAZOS[m].preguntas; return L.filter(function(q){ return q.id===id; })[0]; }
  /* Modo Artículos: cada tarjeta que cita un único artículo del Código Civil se vuelve una pregunta */
  function preguntasDeArticulos(m){
    var RE=/^Art\. (\d+) (CC|CPC|COT|CPP|CT)$/, por={};
    MAZOS[m].tarjetas.forEach(function(t){ var x=RE.exec(t.r); if(!x||new RegExp("\\b"+x[1]+"\\b").test(t.d)) return;   /* si el texto ya nombra el artículo, la pregunta se respondería sola */ (por[x[2]]=por[x[2]]||{t:[],n:[]}); por[x[2]].t.push(t); if(por[x[2]].n.indexOf(+x[1])<0) por[x[2]].n.push(+x[1]); });
    var out=[];
    Object.keys(por).forEach(function(cod){
      var G=por[cod]; if(G.n.length<4) return;   /* hacen falta 4 artículos distintos del mismo código para las alternativas */
      G.t.forEach(function(t){
        var n=+RE.exec(t.r)[1], ops=mezclar(G.n.filter(function(x){ return x!==n; })).slice(0,3).concat([n]).sort(function(a,b){ return a-b; });
        out.push({id:"art-"+t.id,cita:t.d,q:"¿Qué artículo del "+CODIGOS[cod].n+" lo establece?",o:ops.map(function(x){ return "Art. "+x; }),ok:ops.indexOf(n),
                  por:"Es el art. "+n+" del "+CODIGOS[cod].n+": "+t.t.charAt(0).toLowerCase()+t.t.slice(1)+".",r:t.r,u:t.u,fijo:true});
      });
    });
    return out;
  }
  function notaTarjeta(color){
    if(!S||S.tipo!=="t"||!S.vista) return;
    var id=S.cola[S.i]; calificar(S.m,id,color); S.res[color]++;
    if(color==="r") S.cola.splice(Math.min(S.cola.length,S.i+4),0,id);   /* vuelve en esta misma sesión */
    S.i++; S.vista=false; S.rep=null; S.repOk=null; pintar();
  }
  /* modo: «preguntas» (todo el ramo o los temas elegidos, f) o «articulos» */
  function iniciarPreguntas(m,lista,clave,f){
    var P=mezclar((lista||MAZOS[m].preguntas).slice()).slice(0,PREG_SESION), art=!!(clave&&clave.indexOf("#art")>0);
    S={tipo:"p",m:m,clave:clave||m,modo:art?"articulos":"preguntas",f:f||null,rep:null,repOk:null,pregs:P,cola:P.map(function(q){ var o=q.o.map(function(_,i){ return i; }); return {id:q.id,orden:q.fijo?o:mezclar(o)}; }),i:0,elegida:null,ok:0,malas:[]};
    registrar(art?"artículos":f?"preguntas por tema":"preguntas"); pintar();
  }
  function responder(idx){
    if(!S||S.tipo!=="p"||S.elegida!==null) return;
    var it=S.cola[S.i], q=pregunta(S.m,it.id), bien=(it.orden[idx]===q.ok);
    S.elegida=idx; S.rep=null; S.repOk=null; if(bien) S.ok++; else S.malas.push(q.id);
    var h=hist(); h.tot++; if(bien) h.ok++; anotar(S.m,q.id,bien?1:0); guardar(); pintar();
  }
  function siguiente(){
    if(!S||S.tipo!=="p"||S.elegida===null) return;
    S.i++; S.elegida=null; S.rep=null; S.repOk=null;
    if(S.i>=S.cola.length){ var p=E.p[S.clave]=E.p[S.clave]||{int:[]}; p.int.push({f:dia(),ok:S.ok,tot:S.cola.length}); if(p.int.length>30) p.int=p.int.slice(-30); guardar(); }
    pintar();
  }

  /* ── vistas ── */
  var ICO_TARJ='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="13" height="14" rx="2.5"/><path d="M8 3.5h10a2.5 2.5 0 0 1 2.5 2.5v11"/></svg>';
  var ICO_PREG='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2v.01"/></svg>';
  var ICO_TEMAS='<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4 6.5l1 1 2-2M4 12l1 1 2-2"/><circle cx="5" cy="17.5" r="1.2"/></svg>';
  function barraAvance(r){
    var t=Math.max(1,r.total);
    return '<span class="es-barra" aria-hidden="true"><i class="es-dom" style="width:'+(r.dominadas/t*100)+'%"></i><i class="es-rep" style="width:'+(r.repaso/t*100)+'%"></i><i class="es-nue" style="width:'+(r.nuevas/t*100)+'%"></i></span>';
  }
  /* ramos de la malla que el estudiante tiene abierta (plan y jornada); sin malla, los del plan ajustado */
  function malla(){
    try{ var P=window.__mallaSnap&&window.__mallaSnap(), A=P&&P[P.cur]; if(A&&A.C&&A.C.length) return {C:A.C,sem:P.reg==="sem"}; }catch(e){}
    return {C:(typeof COURSES!=="undefined"?COURSES:[]),sem:false};
  }
  function linea(id){ for(var i=0;i<LINEAS.length;i++){ if(LINEAS[i].id===id) return LINEAS[i]; } return null; }
  function ramosDe(L){ return malla().C.filter(function(c){ return L.areas.indexOf(c.a)>=0; }).sort(function(a,b){ return a.t-b.t||a.id-b.id; }); }
  function lineaDe(m){
    var C=malla().C;
    for(var i=0;i<LINEAS.length;i++){ var L=LINEAS[i]; if(C.some(function(c){ return L.areas.indexOf(c.a)>=0&&mazoDe(c.n)===m; })) return L.id; }
    return null;
  }
  function nivel(t){ return (malla().sem?"Semestre ":"Nivel ")+t; }
  function miles(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,"."); }
  /* el ramo con más tarjetas vencidas: lo ofrecen Inicio y la portada de Estudiar */
  function masPendiente(){ var cual=null, n=0; for(var m in MAZOS){ if(empezado(m)){ var r=resumen(m); if(r.vencidas>n){ n=r.vencidas; cual=m; } } } return cual?{m:cual,n:n}:null; }
  function botonRepaso(p,accion){
    return '<button type="button" class="es-repaso'+(accion?' es-hoy':'')+'" '+(accion?'data-es="repasar" data-v':'data-ir2')+'="'+p.m+'"><span class="es-ico">'+ICO_TARJ+'</span><span><b>Repaso de hoy</b> <small>'+
           plural(p.n,"tarjeta","tarjetas")+' de '+esc(MAZOS[p.m].ramo)+'</small></span><span class="i2-avc-ir">Repasar</span></button>';
  }
  /* portada: un botón por línea, con sus ramos, sus tarjetas y lo que hay para hoy */
  function vistaInicio(){
    var h='<h1 class="h1 serif">Estudiar</h1><p class="lead">Elige una línea y luego tu ramo para repasar con tarjetas y preguntas. Tu progreso se guarda en este teléfono.</p>';
    var rc=racha(); if(rc) h+='<p class="es-racha">Racha de '+plural(rc,"día","días")+'</p>';
    var p=masPendiente(); if(p) h+=botonRepaso(p,true);
    var cupo=Math.max(0,limite()-(E.n[dia()]||0));
    h+='<h2 class="es-linea">Elige una línea</h2><div class="es-lineas">';
    LINEAS.forEach(function(L){
      var lista=ramosDe(L); if(!lista.length) return;
      var mz=[]; lista.forEach(function(c){ var m=mazoDe(c.n); if(m&&mz.indexOf(m)<0) mz.push(m); });
      var nom='<span class="es-lin-nom"><i aria-hidden="true"></i><b>'+esc(L.nombre)+'</b></span>';
      if(!mz.length){
        h+='<button type="button" class="es-lin pronto" data-es="linea" data-v="'+L.id+'" style="--lc:'+L.color+'">'+nom+'<small>'+plural(lista.length,"ramo","ramos")+'</small><span class="es-chip gris">Próximamente</span></button>';
        return;
      }
      var t={total:0,dominadas:0,repaso:0,nuevas:0}, nT=0, venc=0, sinVerEmp=0, emp=false;
      mz.forEach(function(m){ var r=resumen(m); t.total+=r.total; t.dominadas+=r.dominadas; t.repaso+=r.repaso; t.nuevas+=r.nuevas; nT+=MAZOS[m].tarjetas.length;
        if(empezado(m)){ emp=true; venc+=r.vencidas; sinVerEmp+=r.nuevas; } });
      var hoy=venc+Math.min(cupo,sinVerEmp);   /* las nuevas del día son un cupo común a todos los ramos */
      var cuantos=mz.length===lista.length?plural(lista.length,"ramo","ramos"):mz.length+' de '+lista.length+' ramos';
      h+='<button type="button" class="es-lin" data-es="linea" data-v="'+L.id+'" style="--lc:'+L.color+'">'+nom+
         '<small>'+cuantos+' · '+miles(nT)+' tarjetas</small>'+
         (emp?(hoy?'<span class="es-chip">Para hoy: '+hoy+'</span>':'<span class="es-chip ok">Al día</span>'):'')+barraAvance(t)+'</button>';
    });
    h+='</div><p class="es-nota">¿Quieres aportar tarjetas o preguntas de tu ramo? Escríbele al Centro de Estudiantes.</p>';
    return h;
  }
  /* una línea: sus ramos en el orden de la malla */
  function vistaLinea(L){
    var lista=ramosDe(L), hay=lista.some(function(c){ return !!mazoDe(c.n); });
    var h='<div class="es-top"><button type="button" class="es-volver" data-es="lineas">‹ Líneas</button></div>'+
          '<h1 class="h1 serif">'+esc(L.titulo)+'</h1><p class="lead">'+(hay?'Elige un ramo. Están en el orden de la malla.':'Todavía no hay tarjetas para esta línea. Estos son sus ramos en la malla.')+'</p><div class="es-lista">';
    lista.forEach(function(c){
      var m=mazoDe(c.n);
      if(!m){ h+='<div class="es-ramo pronto"><span class="es-fila"><b>'+esc(c.n)+'</b> <small>'+nivel(c.t)+'</small></span><small>Próximamente</small></div>'; return; }
      var r=resumen(m), M=MAZOS[m];
      var estado=empezado(m) ? (r.paraHoy?'<span class="es-chip">Para hoy: '+r.paraHoy+'</span>':'<span class="es-chip ok">Al día</span>')
                             : '<span class="es-chip">Nuevo</span>';
      h+='<button type="button" class="es-ramo" data-es="abrir" data-v="'+m+'"><span class="es-fila"><b>'+esc(M.ramo)+'</b>'+estado+'</span>'+
         '<small>'+nivel(c.t)+' · '+plural(M.tarjetas.length,"tarjeta","tarjetas")+' y '+plural(M.preguntas.length,"pregunta","preguntas")+(empezado(m)?', '+r.dominadas+' dominadas':'')+'</small>'+barraAvance(r)+'</button>';
    });
    h+='</div><p class="es-nota">¿Quieres aportar tarjetas o preguntas '+(hay?'de tu ramo':'para estos ramos')+'? Escríbele al Centro de Estudiantes.</p>';
    return h;
  }
  function vistaRamo(m){
    var L=linea(V.l), M=MAZOS[m], r=resumen(m), h='<div class="es-top"><button type="button" class="es-volver" data-es="ramos">‹ '+(L?esc(L.titulo):'Líneas')+'</button></div>';
    h+='<h1 class="h1 serif">'+esc(M.ramo)+'</h1><p class="lead">'+esc(M.nota)+'</p>'+
       (M.revision?'<p class="es-rev ok">Revisado por la cátedra: '+esc(M.revision.docente)+'</p>':'<p class="es-rev">Contenido en revisión docente</p>')+'<div class="es-modos">';
    h+='<button type="button" class="es-modo" data-es="tarjetas"><span class="es-modo-ico">'+ICO_TARJ+'</span><b>Tarjetas</b><span>Recuerda la definición de cada término y evalúa tu dominio.</span>'+
       (r.paraHoy?'<span class="es-chip">Para hoy: '+plural(r.paraHoy,"tarjeta","tarjetas")+'</span>':'<span class="es-chip ok">Al día: vuelve mañana</span>')+'</button>';
    h+='<button type="button" class="es-modo" data-es="preguntas"><span class="es-modo-ico">'+ICO_PREG+'</span><b>Selección múltiple</b><span>Responde y revisa la justificación de cada alternativa.</span>'+
       '<span class="es-chip">'+(r.mejor?'Tu mejor resultado: '+r.mejor.ok+' de '+r.mejor.tot:plural(Math.min(PREG_SESION,M.preguntas.length),"pregunta","preguntas")+' por ronda')+'</span></button>';
    var nArt=LISTOS[m]?preguntasDeArticulos(m).length:(M.art||0), pa=(E.p[m+'#art']&&E.p[m+'#art'].int)||[], mejA=pa.reduce(function(b,x){ return (!b||x.ok/x.tot>b.ok/b.tot)?x:b; },null);
    if(nArt>=4) h+='<button type="button" class="es-modo" data-es="articulos"><span class="es-modo-ico es-par" aria-hidden="true">§</span><b>Artículos</b><span>Lee la regla y reconoce de qué artículo sale.</span>'+
       '<span class="es-chip">'+(mejA?'Tu mejor resultado: '+mejA.ok+' de '+mejA.tot:plural(Math.min(PREG_SESION,nArt),"regla","reglas")+' por ronda')+'</span></button>';
    h+='</div>';
    if(M.temas&&M.temas.length){
      var nSel=seleccion(m).length;
      h+='<button type="button" class="es-temas-entrada" data-es="temas"><span class="es-modo-ico">'+ICO_TEMAS+'</span><span><b>Temas</b><small>'+
         (nSel?plural(nSel,"tema elegido","temas elegidos")+' de '+M.temas.length:plural(M.temas.length,"tema","temas")+': elige cuáles repasar')+'</small></span><span class="es-flecha" aria-hidden="true">›</span></button>';
    }
    var cur=ajuste();
    h+='<div class="es-ajuste"><span>Nuevas por día</span><div class="es-opc" role="radiogroup" aria-label="Tarjetas nuevas por día">'+
       OPCIONES.map(function(n){ return '<button type="button" role="radio" aria-checked="'+(cur===n)+'" class="es-opc-b'+(cur===n?' on':'')+'" data-es="limite" data-v="'+n+'">'+(n||'Todas')+'</button>'; }).join("")+'</div></div>';
    if(!r.paraHoy) h+='<p class="es-extra"><button type="button" class="es-btn2" data-es="tarjetas" data-v="'+(r.nuevas?'mas':'extra')+'">'+(r.nuevas?'Estudiar '+Math.min(10,r.nuevas)+' nuevas más':'Repasar 10 tarjetas adicionales')+'</button></p>';
    /* estadísticas */
    var dias=[], max=1, hoy=dia();
    for(var k=6;k>=0;k--){ var f=mas(hoy,-k), x=E.h[f]||{v:0,a:0,r:0,tot:0}, n=x.v+x.a+x.r+x.tot; max=Math.max(max,n); dias.push({f:f,n:n}); }
    var nom=["D","L","M","X","J","V","S"];
    h+='<section class="es-stats" aria-label="Tu avance en '+esc(M.ramo)+'"><div class="es-fila"><b>Tu avance</b> <small>'+r.dominadas+' de '+r.total+' dominadas</small></div>'+barraAvance(r)+
       '<p class="es-ley"><span><i class="es-dom"></i>Dominadas: '+r.dominadas+'</span><span><i class="es-rep"></i>En repaso: '+r.repaso+'</span><span><i class="es-nue"></i>Nuevas: '+r.nuevas+'</span></p>'+
       '<div class="es-fila"><b>Últimos 7 días</b> <small>'+(racha()?'Racha de '+plural(racha(),"día","días"):'Sin racha todavía')+'</small></div><div class="es-semana" aria-hidden="true">'+
       dias.map(function(d){ var p=d.f.split("-"), wd=new Date(+p[0],+p[1]-1,+p[2]).getDay(); return '<div><i style="height:'+Math.max(3,Math.round(d.n/max*48))+'px;opacity:'+(d.n?1:.25)+'"></i>'+nom[wd]+'</div>'; }).join("")+
       '</div>'+(r.intentos?'<div class="es-fila"><b>Selección múltiple</b> <small>'+plural(r.intentos,"ronda","rondas")+', mejor: '+r.mejor.ok+' de '+r.mejor.tot+'</small></div>':'')+
       (pa.length?'<div class="es-fila"><b>Artículos</b> <small>'+plural(pa.length,"ronda","rondas")+', mejor: '+mejA.ok+' de '+mejA.tot+'</small></div>':'')+'</section>';
    return h;
  }
  /* pantalla de temas: cada tema con su barra; se eligen uno o varios para repasar solo esa materia */
  function nombreFiltro(m,f){ var T=MAZOS[m].temas||[]; return f.length===1&&T[f[0]-1]?T[f[0]-1].t:plural(f.length,"tema elegido","temas elegidos"); }
  function vistaTemas(m){
    var M=MAZOS[m], T=M.temas, sel=seleccion(m), todos=sel.length===T.length;
    var h='<div class="es-top"><button type="button" class="es-volver" data-es="ramo">‹ '+esc(M.ramo)+'</button></div>'+
          '<h1 class="h1 serif">Temas</h1><p class="lead">Elige uno o varios para repasar solo esa materia. La barra muestra tus tarjetas dominadas, en repaso y nuevas de cada tema.</p>'+
          '<p class="es-tsel"><button type="button" class="es-btn2" data-es="temas-todos">'+(todos?'Quitar todos':'Elegir todos')+'</button></p><div class="es-temas">';
    T.forEach(function(t){
      var r=resumenF(m,[t.n]), on=sel.indexOf(t.n)>=0;
      h+='<button type="button" class="es-tfila" data-es="tema" data-v="'+t.n+'" aria-pressed="'+on+'"><span class="es-tcheck" aria-hidden="true">'+(on?'✓':'')+'</span>'+
         '<span class="es-ttxt"><b>'+esc(t.t)+'</b><small>'+plural(r.total,"tarjeta","tarjetas")+' y '+plural(r.nP,"pregunta","preguntas")+(r.vistas?', '+r.dominadas+' dominadas':'')+'</small>'+barraAvance(r)+'</span></button>';
    });
    h+='</div>';
    var acc;
    if(!sel.length) acc='<p>Elige al menos un tema.</p><div class="es-tacc-b"><button type="button" class="es-btn" disabled>Tarjetas</button><button type="button" class="es-btn sec" disabled>Preguntas</button></div>';
    else {
      var r=resumenF(m,sel), modo=r.paraHoy?'':(r.nuevas?'mas':'extra'), nombre=nombreFiltro(m,sel);
      var etq=r.paraHoy?'Tarjetas ('+r.paraHoy+')':(r.nuevas?'Estudiar nuevas':'Repasar al azar');
      var aria=r.paraHoy?'Repasar '+plural(r.paraHoy,"tarjeta","tarjetas")+' de '+nombre:(r.nuevas?'Estudiar '+Math.min(10,r.nuevas)+' tarjetas nuevas de '+nombre:'Repasar 10 tarjetas al azar de '+nombre);
      acc='<p>'+esc(nombre)+': '+plural(r.total,"tarjeta","tarjetas")+' y '+plural(r.nP,"pregunta","preguntas")+'</p>'+
          '<div class="es-tacc-b"><button type="button" class="es-btn" data-es="temas-tarjetas" data-v="'+modo+'" aria-label="'+esc(aria)+'">'+etq+'</button>'+
          '<button type="button" class="es-btn sec" data-es="temas-preguntas"'+(r.nP?' aria-label="'+esc(Math.min(PREG_SESION,r.nP)+' preguntas de '+nombre)+'"':' disabled')+'>'+(r.nP?'Preguntas ('+Math.min(PREG_SESION,r.nP)+')':'Sin preguntas')+'</button></div>';
    }
    return h+'<div class="es-tacc" role="region" aria-label="Repasar los temas elegidos">'+acc+'</div>';
  }
  /* reportar un error: va al CCEE sin nombre, en la misma tabla que las consultas a Dona, con el tema «error-tarjeta» */
  function enviarReporte(m,id,txt){
    try{
      if(typeof ES_PRUEBA!=="undefined"&&ES_PRUEBA) return;
      if(typeof sbc==="undefined"||!sbc) return;
      var jor=null; try{ jor=localStorage.getItem("jornada3_v1")||null; }catch(e){}
      sbc.from("consultas").insert({pregunta:("Error en "+id+" ("+MAZOS[m].ramo+"): "+(txt||"sin comentario")).slice(0,300),respondida:false,tema:"error-tarjeta",jornada:jor})
        .then(function(r){ if(r&&r.error&&window.console) console.warn("[UApp] reporte no registrado:",r.error.message||r.error); },
              function(e){ if(window.console) console.warn("[UApp] reporte: error de red",e&&e.message); });
    }catch(e){}
  }
  function bloqueReporte(id,que){
    if(S.rep===id) return '<div class="es-reporte" role="group" aria-label="Reportar un error"><label for="esRepTxt">¿Qué está mal? Cuéntalo en pocas palabras.</label>'+
      '<textarea id="esRepTxt" maxlength="280" rows="3" placeholder="Por ejemplo: el artículo citado no corresponde"></textarea>'+
      '<div class="es-rep-b"><button type="button" class="env" data-es="rep-enviar">Enviar al CCEE</button><button type="button" class="can" data-es="rep-cancelar">Cancelar</button></div>'+
      '<small class="es-rep-nota">Se envía sin tu nombre.</small></div>';
    if(S.repOk===id) return '<p class="es-rep-ok" role="status">Gracias. El CCEE revisará esta '+que+'.</p>';
    if(E.rep[clave(S.m,id)]) return '<p class="es-rep-ya">Ya reportaste esta '+que+'.</p>';
    return '<button type="button" class="es-reportar" data-es="reportar" data-v="'+esc(id)+'">Reportar un error</button>';
  }
  function progreso(i,n,txt){ return '<div class="es-prog"><button type="button" class="es-volver" data-es="salir" aria-label="Salir de la sesión">✕</button><span class="es-barra"><i style="width:'+(n?i/n*100:0)+'%"></i></span><span>'+txt+'</span></div>'+
    (S&&S.f?'<p class="es-filtro">'+esc(nombreFiltro(S.m,S.f))+'</p>':''); }
  function vistaTarjeta(){
    if(S.i>=S.cola.length){
      var r=resumen(S.m), t=S.res.v+S.res.a+S.res.r, nV=S.f?sinVerF(S.m,S.f):sinVer(S.m).length, volver=S.f?'Volver a los temas':'Volver al ramo';
      var masNuevas=nV?'<button type="button" class="es-btn2 es-prim" data-es="tarjetas" data-v="mas">Estudiar '+Math.min(10,nV)+' nuevas más</button>':'';
      if(!t) return '<div class="es-fin"><p class="es-grande">Al día</p><p>No tienes tarjetas pendientes para hoy en '+(S.f?'estos temas':esc(MAZOS[S.m].ramo))+'.</p><div class="es-botones">'+masNuevas+'<button type="button" class="es-btn2" data-es="salir">'+volver+'</button></div></div>';
      return '<div class="es-fin"><p class="es-etq">Sesión lista</p><p class="es-grande">'+plural(t,"repaso","repasos")+'</p>'+
        '<p class="es-cuentas"><span class="es-chip v">La domino: '+S.res.v+'</span><span class="es-chip a">Con dudas: '+S.res.a+'</span><span class="es-chip r">No la domino: '+S.res.r+'</span></p>'+
        '<p>'+(r.manana?'Mañana te esperan '+plural(r.manana,"tarjeta","tarjetas")+'.':'Vuelve en los próximos días: la app te avisará en Inicio.')+'</p>'+
        '<div class="es-botones">'+masNuevas+
        '<button type="button" class="es-btn2" data-es="salir">'+volver+'</button><button type="button" class="es-btn2" data-es="preguntas">Hacer selección múltiple</button></div></div>';
    }
    var c=tarjeta(S.m,S.cola[S.i]);
    var h=progreso(S.i,S.cola.length,(S.i+1)+' de '+S.cola.length);
    h+='<div class="es-escena"><div class="es-carta'+(S.vista?' vista':'')+'"'+(S.vista?'':' data-es="voltear" role="button" tabindex="0" aria-label="Ver la definición de '+esc(c.t)+'"')+'>'+
       '<div class="es-cara"><span class="es-etq">Término</span><span class="es-termino">'+esc(c.t)+'</span><span class="es-pista">Recuerda la definición y luego compárala.</span></div>'+
       '<div class="es-cara es-dorso" aria-hidden="'+(S.vista?'false':'true')+'"><span class="es-etq">'+esc(c.t)+'</span><span class="es-def">'+esc(c.d)+'</span>'+refs(c)+(S.vista?bloqueReporte(c.id,"tarjeta"):'')+'</div></div></div>';
    h+='<div class="es-acciones">'+(S.vista
      ? '<p class="es-pista es-centro">Evalúa tu respuesta</p><div class="es-semaforo" role="group" aria-label="Evalúa tu respuesta">'+
        '<button type="button" class="es-luz r" data-es="nota" data-v="r"><i></i>No la domino <small>Se repite hoy</small></button>'+
        '<button type="button" class="es-luz a" data-es="nota" data-v="a"><i></i>Con dudas <small>Se repite mañana</small></button>'+
        '<button type="button" class="es-luz v" data-es="nota" data-v="v"><i></i>La domino <small>Repaso espaciado</small></button></div>'
      : '<button type="button" class="es-btn" data-es="voltear">Ver definición</button>')+'</div>';
    return h;
  }
  function vistaPregunta(){
    var L="ABCD";
    if(S.i>=S.cola.length){
      var n=S.cola.length, pct=n?S.ok/n:0, msj=pct>=.9?"¡Excelente!":pct>=.7?"Muy bien":pct>=.5?"Vas bien, sigue practicando":"A repasar: las tarjetas te pueden ayudar";
      var h='<div class="es-fin"><p class="es-etq">Resultado</p><p class="es-grande">'+S.ok+' de '+n+'</p><p>'+msj+'</p>';
      if(S.malas.length){
        h+='<div class="es-malas"><b>Para repasar</b>'+S.malas.map(function(id){ var q=pregunta(S.m,id); return '<div><p>'+esc(q.cita||q.q)+'</p><p><b>Correcta:</b> '+esc(q.o[q.ok])+'.</p>'+fuente(q.r)+'</div>'; }).join("")+'</div>';
      }
      return h+'<div class="es-botones"><button type="button" class="es-btn2" data-es="'+(S.modo==="articulos"?'articulos':'preguntas')+'">Otra ronda</button><button type="button" class="es-btn2" data-es="salir">'+(S.f?'Volver a los temas':'Volver al ramo')+'</button></div></div>';
    }
    var it=S.cola[S.i], q=pregunta(S.m,it.id), lista="";
    it.orden.forEach(function(real,idx){
      var cls="es-op";
      if(S.elegida!==null){ if(real===q.ok) cls+=" ok"; else if(idx===S.elegida) cls+=" mal"; }
      lista+='<button type="button" class="'+cls+'" data-es="op" data-v="'+idx+'"'+(S.elegida!==null?' disabled':'')+'><b>'+L.charAt(idx)+'</b><span>'+esc(q.o[real])+'</span></button>';
    });
    var h=progreso(S.i,S.cola.length,'Pregunta '+(S.i+1)+' de '+S.cola.length)+(q.cita?'<blockquote class="es-cita">'+esc(q.cita)+'</blockquote>':'')+'<p class="es-preg">'+esc(q.q)+'</p><div class="es-ops">'+lista+'</div>';
    if(S.elegida!==null){
      var bien=(it.orden[S.elegida]===q.ok);
      h+='<div class="es-por" role="status"><b>'+(bien?"Correcto":"La correcta era la "+L.charAt(it.orden.indexOf(q.ok)))+'</b><p>'+esc(q.por)+'</p>'+refs(q)+bloqueReporte(q.id,"pregunta")+'</div>'+
         '<div class="es-acciones"><button type="button" class="es-btn" data-es="sig">'+(S.i+1<S.cola.length?"Siguiente":"Ver resultado")+'</button></div>';
    }
    return h;
  }
  function pintar(){
    var app=document.getElementById("estudioApp");
    if(app){
      var L=linea(V.l), conTemas=V.m&&MAZOS[V.m]&&MAZOS[V.m].temas&&MAZOS[V.m].temas.length;
      app.innerHTML=ESPERA?vistaEspera():S?(S.tipo==="t"?vistaTarjeta():vistaPregunta()):(V.m?(V.vt&&conTemas?vistaTemas(V.m):vistaRamo(V.m)):(L?vistaLinea(L):vistaInicio()));
      var txt=S&&S.rep?app.querySelector("#esRepTxt"):null;   /* al abrir el reporte, el cursor va al cuadro de texto */
      if(txt){ try{ txt.focus({preventScroll:true}); }catch(e){} }
      else {
        var f=ESPERA?app.querySelector('[data-es="reintentar"]'):(app.querySelector(".es-luz.v")||app.querySelector('.es-btn')||app.querySelector('.es-op:not([disabled])'));
        if(f&&(S||ESPERA)&&teclado&&document.getElementById("estudio").style.display!=="none"){ try{ f.focus({preventScroll:true}); }catch(e){} }
      }
    }
    pintarRepaso();
  }

  /* ── tarjeta en Inicio ── */
  function pintarRepaso(){
    var box=document.getElementById("repasoBox"); if(!box) return;
    var p=masPendiente(), alguno=false;
    for(var m in MAZOS){ if(empezado(m)){ alguno=true; break; } }
    if(p) box.innerHTML=botonRepaso(p,false);
    else if(!alguno){   /* la invitación lleva a la portada, donde se elige la línea */
      box.innerHTML='<button type="button" class="es-repaso" data-ir2="lineas"><span class="es-ico">'+ICO_TARJ+'</span><span><b>Nuevo: Estudiar</b> <small>Tarjetas y preguntas de tus ramos, con repaso inteligente.</small></span><span class="i2-avc-ir">Probar</span></button>';
    }else box.innerHTML="";
  }
  function abrirDesdeInicio(m,directo){
    var b=document.querySelector('[data-ir="estudio"]'); if(b) b.click();
    V.m=m; V.vt=false; V.l=m?lineaDe(m):null; S=null; ESPERA=null; if(directo) conMazo(m,function(){ iniciarTarjetas(m); }); else pintar();
    window.scrollTo(0,0);
  }

  /* ── eventos ── */
  function iniciar(){
    var app=document.getElementById("estudioApp");
    if(app) app.addEventListener("click",function(e){
      var b=e.target.closest?e.target.closest("[data-es]"):null; if(!b) return;
      var a=b.getAttribute("data-es"), v=b.getAttribute("data-v");
      var f=S&&S.f?S.f:null;   /* lo que se lanza desde el final de una sesión por temas sigue en esos temas */
      if(a==="abrir"){ V.m=v; V.vt=false; V.l=V.l||lineaDe(v); S=null; pintar(); window.scrollTo(0,0); cargarMazo(v).catch(function(){}); }   /* el contenido se adelanta mientras mira el ramo */
      else if(a==="linea"){ V.l=v; V.m=null; V.vt=false; S=null; pintar(); window.scrollTo(0,0); }
      else if(a==="lineas"){ V.l=null; V.m=null; V.vt=false; S=null; pintar(); window.scrollTo(0,0); }
      else if(a==="ramos"){ V.m=null; V.vt=false; S=null; pintar(); window.scrollTo(0,0); }   /* del ramo vuelve a su línea */
      else if(a==="repasar"){ V.m=v; V.vt=false; V.l=lineaDe(v); conMazo(v,function(){ iniciarTarjetas(v); }); window.scrollTo(0,0); }
      else if(a==="temas"){ V.vt=true; S=null; pintar(); window.scrollTo(0,0); }
      else if(a==="ramo"){ V.vt=false; S=null; pintar(); window.scrollTo(0,0); }
      else if(a==="tema"){ var sel=seleccion(V.m), u=+v, i=sel.indexOf(u); if(i>=0) sel.splice(i,1); else sel.push(u); sel.sort(function(x,y){ return x-y; }); pintar(); }
      else if(a==="temas-todos"){ var T=MAZOS[V.m].temas||[]; V.sel[V.m]=seleccion(V.m).length===T.length?[]:T.map(function(t){ return t.n; }); pintar(); }
      else if(a==="temas-tarjetas"){ var s1=seleccion(V.m).slice(), mt=V.m; if(s1.length){ conMazo(mt,function(){ iniciarTarjetas(mt,v,s1); }); window.scrollTo(0,0); } }
      else if(a==="temas-preguntas"){ var s2=seleccion(V.m).slice(), mp=V.m; if(s2.length){ conMazo(mp,function(){ iniciarPreguntas(mp,pregsTema(mp,s2),mp+"#temas",s2); }); window.scrollTo(0,0); } }
      else if(a==="reportar"){ if(S){ S.rep=v; S.repOk=null; pintar(); } }
      else if(a==="rep-cancelar"){ if(S){ S.rep=null; pintar(); } }
      else if(a==="rep-enviar"){
        if(S&&S.rep){ var cx=document.getElementById("esRepTxt"), msg=cx?cx.value.trim():"";
          enviarReporte(S.m,S.rep,msg); E.rep[clave(S.m,S.rep)]=dia(); guardar(); S.repOk=S.rep; S.rep=null; pintar(); }
      }
      else if(a==="tarjetas"){ var m1=V.m; conMazo(m1,function(){ iniciarTarjetas(m1,v,f); }); }
      else if(a==="limite"){ E.cfg.nuevas=+v; guardar(); pintar(); }
      else if(a==="preguntas"){ var m2=V.m; conMazo(m2,function(){ iniciarPreguntas(m2,f?pregsTema(m2,f):null,f?m2+"#temas":null,f); }); }
      else if(a==="articulos"){ var m3=V.m; conMazo(m3,function(){ iniciarPreguntas(m3,preguntasDeArticulos(m3),m3+"#art"); }); }
      else if(a==="reintentar"){ if(ESPERA){ var e2=ESPERA; ESPERA=null; conMazo(e2.m,e2.fn); } }
      else if(a==="espera-volver"){ ESPERA=null; pintar(); }
      else if(a==="voltear"){ if(S&&S.tipo==="t"){ S.vista=true; pintar(); } }
      else if(a==="nota") notaTarjeta(v);
      else if(a==="op") responder(+v);
      else if(a==="sig") siguiente();
      else if(a==="salir"){ S=null; pintar(); }
    });
    document.addEventListener("click",function(e){
      var r=e.target.closest?e.target.closest("[data-ir2]"):null;
      if(r){ var m=r.getAttribute("data-ir2"); if(!MAZOS[m]) m=null; abrirDesdeInicio(m,!!m&&empezado(m)&&resumen(m).vencidas>0); return; }
      if(e.target.closest&&e.target.closest('[data-ir="estudio"]')){
        if(e.target.closest("#estudio")&&!S){ V.m=null; V.l=null; V.vt=false; ESPERA=null; }   /* tocar «Estudiar» estando ahí vuelve a las líneas */
        setTimeout(pintar,0);
      }
      if(e.target.closest&&e.target.closest('.tab[data-tab="mural"],.brand2')) setTimeout(pintarRepaso,0);
    });
    document.addEventListener("keydown",function(e){
      var sec=document.getElementById("estudio"); if(!S||!sec||sec.style.display==="none") return;
      if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      var enBoton=e.target&&/^(BUTTON|A)$/.test(e.target.tagName);   /* Enter sobre un botón hace lo que dice ese botón */
      if(S.tipo==="t"){
        if(!S.vista&&(e.key===" "||e.key==="Enter")){ if(enBoton) return; e.preventDefault(); S.vista=true; pintar(); }
        else if(S.vista&&{"1":"r","2":"a","3":"v"}[e.key]) notaTarjeta({"1":"r","2":"a","3":"v"}[e.key]);
      }else if(S.tipo==="p"){
        if(S.elegida===null&&/^[1-4]$/.test(e.key)) responder(+e.key-1);
        else if(S.elegida!==null&&e.key==="Enter"){ if(enBoton) return; e.preventDefault(); siguiente(); }
      }
    });
    pintar();
    setTimeout(guardarEmpezados,4000);   /* cuando la app ya se mostró, sin competir con lo que se está viendo */
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",iniciar); else setTimeout(iniciar,0);
  window.__estudio={mazos:MAZOS,estado:function(){ return E; },resumen:resumen,pintar:pintar,racha:racha,
    lineas:LINEAS, lineaDe:lineaDe, indice:INDICE, listos:LISTOS, cargar:cargarMazo,
    articulos:function(m){ return preguntasDeArticulos(m).length; },
    recargar:function(){ E=cargar(); V={m:null,l:null,vt:false,sel:{}}; S=null; pintar(); }};
})();
