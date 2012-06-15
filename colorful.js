
var ANSI_CODES = {
   "off": 0
   , "bold": 1
   , "italic": 3
   , "underline": 4
   , "blink": 5
   , "inverse": 7
   , "hidden": 8
   , "black": 30
   , "red": 31
   , "green": 32
   , "yellow": 33
   , "blue": 34
   , "magenta": 35
   , "cyan": 36
   , "white": 37
   , "black_bg": 40
   , "red_bg": 41
   , "green_bg": 42
   , "yellow_bg": 43
   , "blue_bg": 44
   , "magenta_bg": 45
   , "cyan_bg": 46
   , "white_bg": 47
}


var color = function (aColor, string) {
  if (!ANSI_CODES[aColor]) { aColor = 0 }
  if (!string) return ''
  return ('\033[' + ANSI_CODES[aColor] + 'm' + string + '\033[0m')
}

var colorMany = function(commands) {
   //@param commnands is a 2d array
   //color first, string second
   var i = 0
     , s = ''
   for ( ; i < commands.length; i+=1) {
     s += color(commands[i][0], commands[i][1])
   }
   return s
}



exports.color = color
exports.colorMany = colorMany
