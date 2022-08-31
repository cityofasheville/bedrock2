import sys

vmap = {}
template = ""

if __name__ == "__main__":
  if (len(sys.argv) != 4):
    print(f"Usage: {sys.argv[0]} variables_file template_file output_file")

  with (open(sys.argv[1])) as vfile:
    for line in vfile.read().split('\n'):
      print(line)
      words = line.split('=')
      if (len(words) == 2):
        vmap[words[0].strip()] = words[1].strip() # Just skip anything else
    print(vmap)
  with (open(sys.argv[2])) as tfile:
    template = tfile.read()

  for v in vmap:
    rtext = f"$${v}$$"
    print(v, rtext, vmap[v])
    template = template.replace(rtext, vmap[v])
  print(template)

# with open('sku_list.txt', 'r') as skusfile: 
#   for sku in skusfile.read().split('\n'):
#     with open("websitetemplate.asp", 'r') as templatefile: 
#       template = templatefile.read()
#     with open(f"{sku}.asp", 'w+') as writefile: 
#       writefile.write(template.replace('[replacekeyword]', sku))

