const barangayData: { [city: string]: string[] } = {
    "anda": [
          "Bacong",
          "Bad-as",
          "Buenasuerte",
          "Candabong",
          "Casica",
          "Katipunan",
          "Linawan",
          "Lundag",
          "Poblacion",
          "Santa Cruz",
          "Suba",
          "Talisay",
          "Tawid",
          "Ubos",
          "Virgen"
        ],
      "alcantara": [
        "Cabadiangan","Palanas","Cabil-isan","Poblacion","Candabong","Polo","Lawaan","Salagmaya","Manga"
      ],
      "alcoy": [
        "Atabay","Pasol","Daan-Lungsod","Poblacion","Guiwang","Pugalo","Nug-as","San Agustin"
      ],
      "alegria": [
        "Compostela","Montpeller","Guadalupe","Poblacion","Legaspi","Santa Filomena","Lepanto","Valencia","Madridejos"
      ],
      "aloguinsan": [
        "Angilan","Punay","Bojo","Rosario","Bonbon","Saksak","Esperanza","Tampa-an","Kandingan","Toyokon","Kantabogon","Zaragosa","Kawasan","Zaragoza","Olango"
      ],

      "argao": [
      "Alambijud",
      "Lamacan",
      "Anajao",
      "Langtad",
      "Apo",
      "Langub",
      "Balaas",
      "Lapay",
      "Balisong",
      "Lengigon",
      "Binlod",
      "Linut-od",
      "Bogo",
      "Mabasa",
      "Butong",
      "Mandilikit",
      "Bug-ot",
      "Mompeller",
      "Bulasa",
      "Panadtaran",
      "Calagasan",
      "Poblacion",
      "Canbantug",
      "Sua",
      "Canbanua",
      "Sumaguan",
      "Cansuje",
      "Tabayag",
      "Capio-an",
      "Talaga",
      "Casay",
      "Talaytay",
      "Catang",
      "Talo-ot",
      "Colawin",
      "Tiguib",
      "Conalum",
      "Tulang",
      "Guiwanon",
      "Tulic",
      "Gutlang",
      "Ubaub",
      "Jampang",
      "Usmad",
      "Jomgao"
      ],
      "asturias": [
        "Agbanga","New Bago","Agtugop","Owak","Bago","Poblacion","Bairan","Saksak","Banban",
        "San Isidro","Baye","San Roque","Bog-o","Santa Lucia","Kaluangan","Santa Rita",
        "Lanao","Tag-amakan","Langub","Tagbubonga","Looc Norte","Tubigagmanok","Lunas",
        "Tubod","Magcalape","Ubogon","Manguiao"
      ],
      "badian": [
        "Alawijao",
        "Manduyong",
        "Balhaan",
        "Matutinao",
        "Banhigan",
        "Patong",
        "Basak",
        "Poblacion",
        "Basiao",
        "Sanlagan",
        "Bato",
        "Santicon",
        "Bugas",
        "Sohoton",
        "Calangcang",
        "Sulsugan",
        "Candiis",
        "Talayong",
        "Dagatan",
        "Taytay",
        "Dobdob",
        "Tigbao",
        "Ginablan",
        "Tiguib",
        "Lambug",
        "Tubod",
        "Malabago",
        "Zaragosa",
        "Malhiao"
    ],

      "balamban": [
        "Abucayan","Ginatilan","Aliwanay","Hingatmonan","Arpili","Lamesa","Bayong","Liki","Biasong",
        "Luca","Buanoy","Matun-og","Cabagdalan","Nangka","Cabasiangan","Pondol","Cambuhawe",
        "Prenza","Cansomoroy","Singsing","Cantibas","Sunog","Cantuod","Vito","Dungan","Gaas","Santa Cruz-Santo Niño (Pob.)","Baliwagan (Pob.)"
      ],
      "bantayan": [
        "Atop-atop","Luyongbaybay","Baigad","Mojon","Baod","Obo-ob","Binaobao (Pob.)","Patao","Botigues",
        "Putian","Kabac","Sillon","Doong","Sungko","Hilotongan","Suba (Pob.)","Guiwanon","Sulangan",
        "Kabangbang","Tamiao","Kampingganon","Kangkaibe","Kang-actol","Bantigue (Pob.)","Kangkaibe","Lipayran","Ticad (Pob.)"
      ],
      "barili": [
        "Azucena","Luyo","Bagakay","Maghanoy","Balao","Maigang","Bolocboloc","Malolos","Budbud",
        "Mantalongon","Bugtong Kawayan","Mantayupan","Cabcaban","Mayana","Campangga","Minolos","Dakit",
        "Nabunturan","Giloctog","Nasipit","Guibuangan","Pancil","Giwanon","Pangpang","Gunting","Paril",
        "Hilasgasan","Patupat","Japitan","Poblacion","Cagay","San Rafael","Kalubihan","Santa Ana","Kangdampas",
        "Sayaw","Candugay","Tal-ot","Luhod","Tubod","Lupo","Vito"
      ],
      "bogo": [
    "Cogon (Pob.)",
        "Lourdes (Pob.)",
        "Anonang Norte",
        "Malingin",
        "Anonang Sur",
        "Marangog",
        "Banban",
        "Nailon",
        "Binabag",
        "Odlot",
        "Bungtod (Pob.)",
        "Pandan (Pandan Heights)",
        "Carbon (Pob.)",
        "Polambato",
        "Cayang",
        "Sambag (Pob.)",
        "Dakit",
        "San Vicente (Pob.)",
        "Don Pedro Rodriguez",
        "Santo Niño",
        "Gairan",
        "Santo Rosario (Pob.)",
        "Guadalupe",
        "Siocon",
        "La Paz",
        "Taytayan",
        "La Purisima Concepcion (Pob.)",
        "Sudlonon",
        "Libertad"  ],
      "boljoon": [
        "Baclayan","Upper Becerril","El Pardo","Arbor","Granada","Lunop","Lower Becerril","Nangka","Poblacion",
        "South Granada","San Antonio"
      ],
     "borbon": [
        "Bagacay",
        "Don Gregorio Antigua (Taytayan)",
        "Bili",
        "Laaw",
        "Bingay",
        "Lugo",
        "Bongdo",
        "Managase",
        "Bongdo Gua",
        "Poblacion",
        "Bongoyan",
        "Sagay",
        "Cadaruhan",
        "San Jose",
        "Cajel",
        "Tabunan",
        "Campusong",
        "Tagnucan",
        "Clavera"
    ],

      "carcar": [
        "Bolinawan","Perrelos","Buenavista","Valencia","Calidngan","Valladolid","Can-asujan",
        "Poblacion I","Poblacion II","Poblacion III","Guadalupe","Liburon","Napo","Tuyom","Ocana"
      ],
      "carmen": [
        "Baring","Lanipga","Cantipay","Liboron","Cantumog","Lower Natimao-an","Cantukong","Luyang",
        "Caurasan","Poblacion","Corte","Puente","Dawis Norte","Sac-on","Dawis Sur","Triumfo",
        "Cogon East","Upper Natimao-an","Hagnaya","Cogon West","Ipil"
      ],
      "catmon": [
        "Agsuwao","Catmondaan","Amancion","Duyan","Anapog","Ginabucan","Bactas","Macaas",
        "Bongyas","Panalipan","Basak","Tabili","Binongkalan","Tinabyonan","Cabungaan","San Jose (Catadman)",
        "Cambangkaya","Corazon (Pob.)","Can-ibuang","Flores (Pob.)"
      ],
    "cebu_city": [
        "Adlaon",
        "Mabini",
        "Agsungot",
        "Mabolo",
        "Apas",
        "Malubog",
        "Babag",
        "Mambaling",
        "Basak Pardo",
        "Pahina Central (Pob.)",
        "Bacayan",
        "Pahina San Nicolas",
        "Banilad",
        "Pamutan",
        "Basak San Nicolas",
        "Pardo (Pob.)",
        "Binaliw",
        "Pari-an",
        "Bonbon",
        "Paril",
        "Budla-an (Pob.)",
        "Pasil",
        "Buhisan",
        "Pit-os",
        "Bulacao",
        "Pulangbato",
        "Buot-Taup Pardo",
        "Pung-ol-Sibugay",
        "Busay (Pob.)",
        "Punta Princesa",
        "Calamba",
        "Quiot Pardo",
        "Cambinocot",
        "Sambag I (Pob.)",
        "Capitol Site (Pob.)",
        "Sambag II (Pob.)",
        "Carreta",
        "San Antonio (Pob.)",
        "Central (Pob.)",
        "San Jose",
        "Cogon Ramos (Pob.)",
        "San Nicolas Central",
        "Cogon Pardo",
        "San Roque (Ciudad)",
        "Day-as",
        "Santa Cruz (Pob.)",
        "Duljo (Pob.)",
        "Sawang Calero (Pob.)",
        "Ermita (Pob.)",
        "Sinsin",
        "Guadalupe",
        "Sirao",
        "Guba",
        "Suba Pob. (Suba San Nicolas)",
        "Hippodromo",
        "Sudlon I",
        "Inayawan",
        "Sapangdaku",
        "Kalubihan (Pob.)",
        "T. Padilla",
        "Kalunasan",
        "Tabunan",
        "Kamagayan (Pob.)",
        "Tagbao",
        "Camputhaw (Pob.)",
        "Talamban",
        "Kasambagan",
        "Taptap",
        "Kinasang-an Pardo",
        "Tejero (Villa Gonzalo)",
        "Labangon",
        "Tinago",
        "Lahug (Pob.)",
        "Tisa",
        "Lorega (Lorega San Miguel)",
        "To-ong Pardo",
        "Lusaran",
        "Zapatera",
        "Luz",
        "Sudlon II"
    ],
      "compostela": [
        "Bagalnga","Lupa","Basak","Magay","Buluang","Mulao","Cabadiangan","Panangban","Cambayog",
        "Poblacion","Canamucan","Tag-ube","Cogon","Tamiao","Dapdap","Tubigan","Estaca"
      ],
      "consolacion": [
        "Cabangahan","Pitogo","Cansaga","Poblacion Occidental","Casili","Poblacion Oriental","Danglag",
        "Polog","Garing","Pulpogan","Jugan","Sacsac","Lamac","Tayud","Lanipga","Tilhaong","Nangka",
        "Tolotolo","Panas","Tugbongan","Panoypoy"
      ],
      "cordova": [
        "Alegria","Gabi","Bangbang","Gilutongan","Buagsong","Ibabao","Catarman","Pilipog","Cogon",
        "Poblacion","Dapitan","San Miguel","Day-as"
      ],
      "daanbantayan": [
        "Aguho","Malbago","Bagay","Malingin","Bakhawan","Maya","Bateria","Pajo","Bitoon","Paypay",
        "Calape","Poblacion","Carnaza","Talisay","Dalingding","Tapilon","Lanao","Tinubdan","Logon","Tominjao"
      ],
      "dalaguete": [
        "Ablayan","Lumbang","Babayongan","Malones","Balud","Maloray","Banhigan","Mananggal","Bulak",
        "Manlapay","Caliongan","Mantalongon","Caleriohan","Nalhub","Casay","Obo","Obong","Catolohan",
        "Cawayan","Panas","Consolacion","Poblacion","Coro","Sacsac","Dugyan","Tapun","Dumalan","Jolomaynon",
        "Salug","Tabon","Tapul","Tuba","Tuyom"
      ],
      "danao": [
        "Baliang","Manlayag","Bayabas","Mantija","Binaliw","Masaba","Cabungahan","Maslog","Cagat-Lamac",
        "Nangka","Cahumayan","Oguis","Cambanay","Pili","Cambubho","Poblacion","Cogon-Cruz","Quisol",
        "Danasan","Sabang","Dungga","Sacsac","Dunggoan","Sandayong Norte","Guinacot","Sandayong Sur",
        "Guinsay","Santa Rosa","Ibo","Santican","Langosig","Sibacan","Lawaan","Suba","Licos","Taboc",
        "Looc","Togonon","Magtagobtob","Malapoc","Tuburan Sur"
      ],
      "dumanjug": [
        "Balaygtiki","Cotcoton","Bitoon","Lamak","Bulak","Lawaan","Bullogan","Liong","Doldol","Manlapay",
        "Kabalaasnan","Masa","Kambanog","Panlaan","Camboang","Pawa","Candabong Ilaya (Pob.)","Kang-actol (Poblacion Looc)",
        "Kanghalo (Poblacion Sima)","Kanghumaod","Tangil","Kanguha","Tapon","Tubod-Bitoon","Kanyuko","Tubod-Dugoan","Cogon (Poblacion Central)","Kolabtingon"
      ],
      "ginatilan": [
        "Anao","Looc","Cagsing","Malatbo","Calabawan","Mangaco","Cambagte","Palanas","Campisong","Poblacion",
        "Canorong","Salamanca","Guiwanon","San Roque"
      ],
      "lapu_lapu": [
        "Agus","Maribago","Babag","Marigondon","Bankal","Pajac","Baring","Pajo","Basak","Pangan-an","Buaya",
        "Poblacion","Calawisan","Punta Engaño","Canjulao","Pusok","Caw-oy","Sabang","Cawhagan","Santa Rosa",
        "Caubian","Subabasbas","Gun-ob","Talima","Ibo","Tingo","Looc","Tungasan","Mactan","San Vicente"
      ],
      "liloan": [
        "Cabadiangan","Poblacion","Calero","San Roque","Catarman","San Vicente","Cotcot","Santa Cruz","Jubay","Tabla",
        "Lataban","Tayud","Mulao","Yati"
      ],
      "madridejos": [
        "Bunakan","Pili","Kangwayan","Poblacion","Kaongkod","San Agustin","Kodia","Tabagak","Maalat","Talangnan","Malbago","Tarong","Mancilang","Tugas"
      ],
      "malabuyoc": [
        "Armeña (Cansilongan)","Mindanao (Pajo)","Tolosa (Calatagan)","Montañeza (Inamlang)","Cerdeña (Ansan)",
        "Salmeron (Bulak)","Labrador (Bulod)","Santo Niño","Looc","Sorsogon (Balimaya)","Lombo","Barangay I (Pob.)","Barangay II (Pob.)","Mahanlud"
      ],
      "mandaue": [
        "Alang-alang","Labogon","Bakilid","Looc","Banilad","Maguikay","Basak","Mantuyong","Cabancalan","Opao",
        "Cambaro","Pakna-an","Canduman","Pagsabungan","Casili","Subangdaku","Casuntingan","Tabok","Centro (Pob.)",
        "Tawason","Cubacub","Tingub","Guizo","Tipolo","Ibabao-Estancia","Umapad","Jagobiao"
      ],
      "medellin": [
        "Antipolo","Lamintak Norte","Curva","Luy-a","Daanlungsod","Poblacion","Dalingding Sur","Tindog",
        "Dayhagon","Gibitngil","Don Virgilio Gonzales","Canhabagat","Lamintak Sur","Caputatan Norte",
        "Maharuhay","Caputatan Sur","Mahawak","Kawit"
      ],
      "minglanilla": [
        "Cadulawan","Poblacion Ward II","Calajo-an","Poblacion Ward III","Camp 7","Poblacion Ward IV","Camp 8",
        "Tubod","Cuanos","Tulay","Guindaruhan","Tunghaan","Linao","Tungkop","Manduang","Vito","Pakigne","Tungkil","Poblacion Ward I"
      ],
      "moalboal": [
        "Agbalanga","Lanao","Bala","Poblacion East","Balabagon","Poblacion West","Basdiot","Saavedra",
        "Batadbatad","Tomonoy","Bugho","Tuble","Buguil","Tunga","Busay"
      ],
      "naga": [
        "Alfaco","Lutac","Bairan","Mainit","Balirong","Mayana","Cabungahan","Naalad","Cantao-an",
        "North Poblacion","Central Poblacion","Pangdan","Cogon","Patag","Colon","South Poblacion","East Poblacion",
        "Tagjaguimit","Inoburan","Tangke","Inayagan","Tinaan","Jaguimit","Tuyan","Lanas","Uling","West Poblacion"
      ],
      "oslob": [
        "Alo","Lagunde","Bangcogon","Looc","Bonbon","Luka","Calumpang","Mainit","Canangca-an","Manlum",
        "Cañang","Nueva Caceres","Can-ukban (Poblacion)","Cansalo-ay","Pungtod","Daanlungsod","Tan-awan","Gawi","Tumalog","Hagdan"
      ],
      "pilar": [
        "Biasong","Montserrat","Cawit","San Isidro","Dapdap","San Juan","Esperanza","Upper Poblacion","Lanao","Villahermosa",
        "Lower Poblacion","Imelda","Moabog"
      ],
      "pinamungahan": [
        "Anislag","Opao","Anopog","Pandacan","Binabag","Poblacion","Buhingtubig","Punod","Busay","Rizal",
        "Butong","Sacsac","Cabiangon","Sambagon","Camugao","Sibago","Duangan","Tajao","Guimbawian","Tangub",
        "Lamac","Tanibag","Lut-od","Tupas","Mangoto","Tutay"
      ],
      "poro": [
        "Adela","Mercedes","Altavista","Pagsa","Cagcagan","Paz","Cansabusab","Rizal","Daan Paz","San Jose",
        "Eastern Poblacion","Santa Rita","Esperanza","Teguis","Libertad","Western Poblacion","Mabini"
      ],
      "ronda": [
        "Butong","Libo-o","Can-abuhon","Malalay","Canduling","Palanas","Cansalonoy","Poblacion","Cansayahon",
        "Santa Cruz","Ilaya","Tupas","Langin","Vive"
      ],
      "samboan": [
        "Basak","Jumangpas","Bonbon","Camburoy","Bulangsuran","Poblacion","Calatagan","San Sebastian","Cambigong","Suba","Canorong","Tangbo","Colase","Monteverde","Dalahikan"
      ],
      "san_fernando": [
        "Balud","Pitalo","Balungag","San Isidro","Basak","Sangat","Bugho","Poblacion South","Cabatbatan","Tabionan",
        "Greenhills","Tananas","Lantawan","Tinubdan","Liburon","Tonggo","Magsico","Tubod","Poblacion North","Ilaya","Panadtaran"
      ],
      "san_francisco": [
        "Montealegre","Santa Cruz","Cabunga-an","Santiago","Campo","Sonog","Consuelo","Southern Poblacion","Esperanza","Unidos",
        "Himensulan","Union","Northern Poblacion","Western Poblacion","San Isidro"
      ],
      "san_remegio": [
        "Anapog","Lawis","Argawanon","Libaong","Bagtic","Looc","Bancasan","Luyang","Batad","Mano","Busogon",
        "Poblacion","Calambua","Punta","Canagahan","Sab-a","Dapdap","San Miguel","Gawaygaway","Tacup","Hagnaya",
        "Tambongon","Kayam","To-ong","Kinawahan","Victoria","Lambusan"
      ],
      "santa_fe": [
        "Hagdan","Okoy","Hilantagaan","Poblacion","Kinatarkan","Balidbid","Langub","Pooc","Maricaban","Talisay"
      ],
      "santander": [
        "Bunlan","Looc","Cabutongan","Pasil","Candamiang","Poblacion","Liloan","Talisay","Lip-tong","Canlumacad"
      ],
      "sibonga": [
        "Abugon","Lamacan","Bae","Libo","Bagacay","Lindogon","Bahay","Magcagong","Banlot","Manatad","Basak","Mangyan",
        "Bato","Papan","Cagay","Poblacion","Can-aga","Sabang","Candaguit","Sayao","Cantolaroy","Simala","Dugoan","Tubod","Guimbangco-an"
      ],
      "sogod": [
        "Ampongol","Ibabao","Bagakay","Liki","Bagatayam","Lubo","Bawo","Mohon","Cabalawan","Nahus-an","Cabangahan","Poblacion",
        "Calumboyan","Tabunok","Dakit","Takay","Damolog","Pansoy"
      ],
      "tabogon": [
        "Alang-alang","Manlagtang","Caduawan","Maslog","Kal-anan","Muabog","Camoboan","Pio","Canaocanao","Poblacion",
        "Combado","Salag","Daantabogon","Sambag","Ilihan","San Isidro","Labangon","San Vicente","Libjo","Somosa",
        "Loong","Taba-ao","Mabuli","Tapul","Managase"
      ],
      "tabuelan": [
        "Bongon","Maravilla","Kanlim-ao","Olivo","Kanluhangon","Poblacion","Kantubaon","Tabunok","Dalid","Tigbawan","Mabunao","Villahermosa"
      ],
      "talisay": [
        "Bulacao","Poblacion","Cadulawan","Pooc","Cansojong","San Isidro","Dumlog","San Roque","Jaclupan","Tabunoc",
        "Lagtang","Tangke","Lawaan I","Tapul","Linao","Biasong","Maghaway","Camp IV","Manipis","Lawaan II","Mohon","Lawaan III"
      ],
    "toledo": [
        "Awihao",
        "Media Once",
        "Bagakay",
        "Pangamihan",
        "Bato",
        "Poblacion",
        "Biga",
        "Poog",
        "Bulongan",
        "Putingbato",
        "Bunga",
        "Sagay",
        "Cabitoonan",
        "Sam-ang",
        "Calongcalong",
        "Sangi",
        "Cambang-ug",
        "Santo Niño (Mainggit)",
        "Camp 8",
        "Subayon",
        "Canlumampao",
        "Talavera",
        "Cantabaco",
        "Tungkay",
        "Capitan Claudio",
        "Tubod",
        "Carmen",
        "Sangi",
        "Daanglungsod",
        "Santo Niño (Mainggit)",
        "Don Andres Soriano (Lutopan)",
        "Subayon",
        "Dumlog",
        "Talavera",
        "Ibo",
        "Tungkay",
        "Ilihan",
        "Tubod"
    ],
    "tuburan": [
        "Alegria",
        "Libo",
        "Amatugan",
        "Lusong",
        "Antipolo",
        "Macupa",
        "Apalan",
        "Mag-alwa",
        "Bagasawe",
        "Mag-antoy",
        "Bakyawan",
        "Mag-atubang",
        "Bangkito",
        "Maghan-ay",
        "Bulwang",
        "Mangga",
        "Kabangkalan",
        "Marmol",
        "Kalangahan",
        "Molobolo",
        "Kamansi",
        "Montealegre",
        "Kan-an",
        "Putat",
        "Kanlunsing",
        "San Juan",
        "Kansi",
        "Sandayong",
        "Caridad",
        "Santo Niño",
        "Carmelo",
        "Siotes",
        "Cogon",
        "Sumon",
        "Colonia",
        "Tominjao",
        "Daan Lungsod",
        "Tomugpa",
        "Fortaliza",
        "Barangay I (Pob.)",
        "Ga-ang",
        "Barangay II (Pob.)",
        "Gimama-a",
        "Barangay III (Pob.)",
        "Jagbuaya",
        "Barangay IV (Pob.)",
        "Kabkaban",
        "Barangay V (Pob.)",
        "Kagba-o",
        "Barangay VI (Pob.)",
        "Kampoot",
        "Barangay VII (Pob.)",
        "Kaorasan",
        "Barangay VIII (Pob.)"
    ],

      "tudela": [
        "Buenavista","Puertobello","Calmante","Santander","Daan Secante","Secante Bag-o","General","Southern Poblacion","McArthur","Villahermosa","Northern Poblacion"
      ],
      "tubigon": [
        "Bunacan","Cabulihan","Cahayag","Centro","Geronimo","Guiwanon","Ilihan Norte","Ilihan Sur","Imelda","Inaghuban",
        "Maca-as","Panadtaran","Panaytayon","Pinayagan Norte","Pinayagan Sur","Pooc Occidental","Pooc Oriental","Potohan","Sikatuna","Ubojan","Ubos Cabawan"
      ],
        "jagna": [
          "Alejawan",
          "Balili",
          "Boctol",
          "Bunga Ilaya",
          "Bunga Mar",
          "Buyog",
          "Cabunga-an",
          "Calabacita",
          "Cambugason",
          "Can-ipol",
          "Can-uba",
          "Canjulao",
          "Cantagay",
          "Cantuyoc",
          "Ipil",
          "Kinagbaan",
          "Laca",
          "Larapan",
          "Lonoy",
          "Looc",
          "Malbog",
          "Naatang",
          "Nausok",
          "Odiong",
          "Pagina",
          "Pangdan",
          "Poblacion",
          "Tejero",
          "Tubod Mar",
          "Tubod Monte"
        ],
    "panglao": [
          "Bil-isan",
          "Bolod",
          "Danao",
          "Daulungan",
          "Doljo",
          "Libaong",
          "Looc",
          "Lourdes",
          "Poblacion",
          "Tangnan",
          "Tawala"
        ],
        "tagbilaran": [
          "Bool",
          "Booy",
          "Cabawan",
          "Cogon",
          "Dampas",
          "Dao",
          "Manga",
          "Mansasa",
          "Poblacion I",
          "Poblacion II",
          "Poblacion III",
          "San Isidro",
          "Taloto",
          "Tiptip",
          "Ubujan"
        ],
    };
 export default barangayData;
