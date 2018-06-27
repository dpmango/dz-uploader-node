var express  =  require( 'express' );
var cors     =  require( 'cors' );
var multer   =  require( 'multer' );
var getVideoInfo = require('get-video-info');
var storage  =  multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  })
var upload   =  multer( { storage: storage });

var sizeOf   =  require( 'image-size' );
require( 'string.prototype.startswith' );

// CREATE EXPRESS INSTANCE
var app = express();

// CORS
var whitelist = [
  'http://localhost:3000',
  'http://voxgun.surge.sh'
];
var corsOptions = {
  origin: function(origin, callback){
    var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
    callback(null, originIsWhitelisted);
  },
  credentials: true
};
app.use(cors(corsOptions));

app.use( express.static( __dirname + '/bower_components' ) );

app.post( '/', upload.single( 'file' ), function( req, res, next ) {

  // validate for image only
  // if ( !req.file.mimetype.startsWith( 'image/' ) ) {
  //   return res.status( 422 ).json( {
  //     error : 'The uploaded file must be an image'
  //   } );
  // }

  var mimetype = req.file.mimetype

  if ( mimetype.startsWith( 'image/' ) ) {
    var dimensions = sizeOf( req.file.path );

    if ( ( dimensions.width < 640 ) || ( dimensions.height < 480 ) ) {
      return res.status( 422 ).json( {
        error : 'The image must be at least 640 x 480px'
      } );
    }

    return res.status( 200 ).send( req.file );

  } else if ( mimetype.startsWith( 'video/' ) ){
    getVideoInfo(req.file.path).then(info => {
      var responce = req.file
      responce.duration = info.format.duration
      responce.video_size = info.streams[0].width + 'x' + info.streams[0].height
      return res.status( 200 ).send( responce );
    })
  } else {
    return res.status( 200 ).send( req.file );
  }

});

app.get('/uploads/:filename', function(req,res,next){
  var options = {
    root: __dirname + '/uploads/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };

  var fileName = req.params.filename;
  res.sendFile(fileName, options, function (err) {
    if (err) {
      next(err);
    } else {
      console.log('Sent:', fileName);
    }
  });
});

app.listen( 8090, function() {
  console.log( 'Express server listening on port 8090' );
});
