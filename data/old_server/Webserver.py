__version__ = "0.6"

#TEMPLATED from SimpleHTTPServer

import re #re
import commands #commands
import os #operating system library
import posixpath #posix path
import BaseHTTPServer #Server Class
import urllib #???
import cgi #???
import sys #system
import shutil #deleate things
import mimetypes #system file encodings
import zipfile #zip/unzip things
from datetime import datetime #date and time


try:
    from cStringIO import StringIO
except ImportError:
    from StringIO import StringIO


class SimpleHTTPRequestHandler(BaseHTTPServer.BaseHTTPRequestHandler):

    FilePathArray = os.path.dirname(os.path.abspath(__file__)).split("/")
    FilePath = "/".join(FilePathArray)

    server_version = "SimpleHTTP/" + __version__

    def do_GET(self):
        """Serve a GET request."""
        f = self.getFiles()
        if f:
            self.copyfile(f, self.wfile)
            f.close()

    def do_HEAD(self):
        """Serve a HEAD request."""
        f = self.getFiles()
        if f:
            f.close()

    def do_PUT(self):
        self.uploadFile();

    #def do_POST(self):    

    def uploadFile(self):
        length = int(self.headers['Content-Length'])
        content = self.rfile.read(length)
        self.send_response(200)

        print(self.path);
        FileName = self.path.split('/')[-1]
        FileNameBase = FileName.split('.')[0]
        FileExt = FileName.split('.')[1]

        if FileExt == "zip":
            self.LogIp("Playgrounder")
            print FileName + " Was put/posted, writing to playground..."
            PutPlace = self.FilePath + '/proj/playground/'
            f = open(PutPlace + FileName, 'w+')
            f.write(content)
            f.close()

            if(os.path.isdir(PutPlace + FileNameBase)):
                print "Deleating old dir"
                shutil.rmtree(PutPlace + FileNameBase)

            zip = zipfile.ZipFile(PutPlace + FileName, 'r')
            zip.extractall(PutPlace)
            zip.close()
            try:
                os.remove(PutPlace + FileName)
                os.system("rm -r __MACOSX")
            except:
                print "playground cleanup error"
        else:
            self.LogIp("Haxor Suspect: Uploaded " + FileName)


    def LogIp(self, User):

        Date = datetime.now().strftime('%m/%d/%Y - %H:%M:%S')
        ip = str(self.client_address)

        #str Manipulation

        ip = ip.split(",")[0]
        ip = ip[2:]
        ip = ip[:-1]
        MarkerTitle = ip + " at " + Date + " @ " + User
        print MarkerTitle
        '''
        LatLong = commands.getoutput("curl -s freegeoip.net/xml/" + ip).split('\n')
        Lat = LatLong[9].split('>')[1].split('<')[0]
        Long = LatLong[10].split('>')[1].split('<')[0]
        LogIpOut = Lat + ',' + Long + "," + MarkerTitle
        #Location of file


        #Write to geo file
        geor = open(geofl, "r+")
        lines = geor.readlines()
        geor.seek(0)
        for i in geor:
            if ip not in i:
                geor.write(i)

        geor.truncate()
        geor.close()

        #write to file
        geof = open(geofl, "a+")
        geof.write(LogIpOut + '\n');
        geof.close()
        '''


    def getFiles(self):

        #Do User Check
        BadExtentions = ["cfg","py"]
        try:
            pathExt = self.path.split(".")[-1]
        except IndexError:
            pathExt = None

        send404 = False

        if pathExt in BadExtentions and pathExt != None:
            self.LogIp("Haxor Suspect: " + self.path)
            self.path = "/lib/404/index.html"
        else:
            self.LogIp("Visitor: " + self.path)


        #TRANSLATE WEBPATH TO LOCAL FILESYSTEM
        ErrPath = self.translate_path("/lib/404/index.html")
        path = self.translate_path(self.path)
        f = None

        #Checking if path is correct
        if os.path.isdir(path):
            if not self.path.endswith('/'):
                # redirect browser and adding '/' - doing basically what apache does
                self.send_response(301)
                self.send_header("Location", self.path + "/")
                self.end_headers()
                return None

            #So url doesn't show html files
            for index in "index.html", "index.htm":
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break

        ctype = self.guess_type(path)
        #print path.split('/')[-1]
        if path.split('/')[-1] == "playground":
            return self.list_directory(path)
        try:
            f = open(path, 'rb') #USER BINARY MODE ELSE \n MIGHT TRIGGER
        except IOError:
            #print "Could not find file"
            if not send404:
                ctype = self.guess_type(ErrPath)
                f = open(ErrPath, 'rb')
            else:
                self.send_error(404, "Nuffin")
                return None

        self.send_response(200)
        self.send_header("Content-type", ctype)
        fs = os.fstat(f.fileno())
        self.send_header("Content-Length", str(fs[6]))
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def translate_path(self, path):
        """Translate path to local directory style"""
        # abandon query parameters
        path = path.split('?',1)[0]
        path = path.split('#',1)[0]

        path = posixpath.normpath(urllib.unquote(path))
        words = path.split('/')
        words = filter(None, words) #path filter
        path = os.getcwd()
        for word in words:
            drive, word = os.path.splitdrive(word)
            head, word = os.path.split(word)
            if word in (os.curdir, os.pardir): continue
            path = os.path.join(path, word)
        return path

    def copyfile(self, source, outputfile):
        shutil.copyfileobj(source, outputfile)

    def guess_type(self, path):

        base, ext = posixpath.splitext(path)
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        ext = ext.lower()
        if ext in self.extensions_map:
            return self.extensions_map[ext]
        else:
            return self.extensions_map['']

    if not mimetypes.inited:
        mimetypes.init() # try to read system mime.types
    extensions_map = mimetypes.types_map.copy()
    extensions_map.update({
        '': 'application/octet-stream', # Default
        '.py': 'text/plain',
        '.c': 'text/plain',
        '.h': 'text/plain',
        '.js': 'text/plain'
        })

    def log_message(self, format, *args):
        return
    def listdir_nohidden(self, path):
        [f for f in os.listdir(path) if not f.startswith('.')]
    def list_directory(self, path):
        try:
            list = (f for f in os.listdir(path) if not f.startswith('.'))
        except os.error:
            self.send_error(404, "No permission to list directory")
            return None
        #list.sort(key=lambda a: a.lower())
        f = StringIO()
        f.write('This is the PLAYGROUND, upload ZIP files to server for them to appear here\n')
        f.write('<META NAME="ROBOTS" CONTENT="NOINDEX, NOFOLLOW">\n')
        f.write('<form enctype="multipart/form-data" method="post" action="http://zyancraft.net:80/"><input name="file" type="file"/><input type="submit" value="upload"/></form>')
        for name in list:
            fullname = os.path.join(path, name)
            displayname = linkname = name
            # Append / for directories or @ for symbolic links
            if os.path.isdir(fullname):
                displayname = name + "/"
                linkname = name + "/"
            if os.path.islink(fullname):
                displayname = name + "@"
                # Note: a link to a directory displays with @ and links with /
            f.write('<li><a href="%s">%s</a>\n'
                    % (urllib.quote(linkname), cgi.escape(displayname)))
        length = f.tell()
        f.seek(0)
        self.send_response(200)
        encoding = sys.getfilesystemencoding()
        self.send_header("Content-type", "text/html; charset=%s" % encoding)
        self.send_header("Content-Length", str(length))
        self.end_headers()
        return f

def test(HandlerClass = SimpleHTTPRequestHandler, ServerClass = BaseHTTPServer.HTTPServer):
    BaseHTTPServer.test(HandlerClass, ServerClass)


if __name__ == '__main__':
    test()
