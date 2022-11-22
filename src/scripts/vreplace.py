import sys
import argparse

vmap = {}
template = ""

def createArgParser():
  parser = argparse.ArgumentParser()
  parser.add_argument('templateFile')
  parser.add_argument('outputFile')
  parser.add_argument('-v', '--variable', action='append', help='Variable definition in the form name=value (no spaces)')
  parser.add_argument('-f', '--variableFile', help='Name of file with variable definitions')
  return parser

if __name__ == "__main__":

  parser = createArgParser()
  args = parser.parse_args()

  if args.variableFile is not None:
    with (open(args.variableFile, 'r')) as vfile:
      for line in vfile.read().split('\n'):
        words = line.split('=')
        if (len(words) == 2):
          vmap[words[0].strip()] = words[1].strip() # Just skip anything else

  if args.variable is not None and len(args.variable) > 0:
    for vdef in args.variable:
      v = vdef.split('=')
      vmap[v[0]] = v[1]

  with (open(args.templateFile, 'r')) as tfile:
    template = tfile.read()

  for v in vmap:
    rtext = f"$${v}$$"
    template = template.replace(rtext, vmap[v])

  with (open(args.outputFile, 'w+')) as wfile:
    wfile.write(template)
else:
  print(f"Name should be __main__ but is {__name__}")

