import sys

vmap = {}
template = ""

if __name__ == "__main__":
  if (len(sys.argv) != 4):
    print(f"Usage: {sys.argv[0]} variables_file template_file output_file")

  with (open(sys.argv[1], 'r')) as vfile:
    for line in vfile.read().split('\n'):
      words = line.split('=')
      if (len(words) == 2):
        vmap[words[0].strip()] = words[1].strip() # Just skip anything else
  with (open(sys.argv[2], 'r')) as tfile:
    template = tfile.read()

  for v in vmap:
    rtext = f"$${v}$$"
    template = template.replace(rtext, vmap[v])

  with (open(sys.argv[3], 'w+')) as wfile:
    wfile.write(template)
else:
  print(f"Name should be __main__ but is {__name__}")

