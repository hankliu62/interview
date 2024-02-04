var fs = require( 'fs' );
var path = require( 'path' );
var process = require( 'process' );
var markdownpdf = require( 'markdown-pdf' );


var md_dir = path.join(process.cwd(), "markdown");
var pdf_dir = path.join(process.cwd(), "public");

// Loop through all the files in the directory
fs.readdir( md_dir, function( err, files ) {
  if( err ) {
    console.error( "Could not list the directory.", err );
    process.exit( 1 );
  }

  files.forEach( function( file, index ) {
    // Make one pass and make the file complete
    var md_path = path.join( md_dir, file );
    var pdf_path = path.join( pdf_dir, file + '.pdf' );

    fs.stat( md_path, function( error, stat ) {
      if( error ) {
        console.error( "Error stating file.", error );
        return;
      }

      // Start PDF Process on the files
      if( stat.isFile() ) {
        console.log( "'%s' is a file.", md_path );
        console.log( "Stripping Jekyll Front-Matter...");

        var fileContents = fs.readFileSync(md_path, 'utf8');
        var pattern = /^---\n.*\n---\n/;

        // Strip everything between the first two sets of '---'
        var stripped_md = fileContents.replace( pattern, '' );
        console.log( "Front-Matter stripped." );

        // Pass that to markdown-pdf
        markdownpdf().from.string(stripped_md).to(pdf_path, function () {
          console.log("Created", pdf_path)
        } );
      }

      // If it's not a file
      else if( stat.isDirectory() ) {
        console.log( "'%s' is a directory.", md_path );
      }
    } );
  } );
} );