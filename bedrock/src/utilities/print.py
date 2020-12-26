
def print_list_in_columns(a, ncol=3, width=35):
    for count, itm in enumerate(a, 1):
        print (" " + itm.ljust(width), end=' ')
        if count % ncol == 0:
            print('')
    print('')

