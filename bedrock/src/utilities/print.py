def pretty_print_list(a):
    ll = len(a)
    i = 0
    s = "     "
    for itm in a:
        if i == ll-1:
            s = s + itm
        else:
            s = s + itm + ",  "
        i = i + 1
        if i > 0 and i%5 == 0:
            s = s + "\n     "
    print(s)
