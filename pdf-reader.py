import sys
import pdfplumber
import json
try:
    path = sys.argv[1]
    with open('pdf-static-text.txt', 'w', encoding="utf-8", errors='ignore') as file:
        with pdfplumber.open(f"./uploads/{path}") as pdf:
            for page in pdf.pages:
                text = page.extract_text(x_tolerance=1)
                file.write(text)
except Exception as err:
    print(err)
# creating dictionary
try:
    filename = 'pdf-static-text.txt'
    with open(filename, 'r', encoding="utf-8", errors='ignore') as fh:
        lines = fh.readlines()
        filtered_lines = [line for line in lines if (
            len(line) > 6 and len(line) < 100)]

        with open(r'pdf-filtered-text.txt', 'w', encoding="utf-8", errors='ignore') as f:
            for line in filtered_lines:
                f.write(line)
except Exception as err:
    print(err)
try:
    dict1 = {}
    file = 'pdf-filtered-text.txt'
# resultant dictionary
# fields in the sample file
    fields = [0, 1, 2, 3, 4, 5, 6, 7,8,9,10,11]
    with open(file, 'r', encoding="utf-8", errors='ignore') as fh:
   # count variable for employee id creation
        l = 1
        for line in fh:
    # reading line by line from the text file
            description = list(line.strip().split(None, 11))
            description.append('')
            description.append('')
            description.append('')
            description.append('')
            description.append('')
            description.append('')
            description.append('')
            description.append('')
            description.append('')
            description.append('')
            description.append('')
 # for automatic creation of id for each employee
            sno = str(l)
            # loop variable
            i = 0
            # intermediate dictionary
            dict2 = {}
            while i < len(fields):
 # creating dictionary for each employee
                dict2[fields[i]] = description[i]
                # else:
                #  dict2[fields[i]] = description[i]
                i = i + 1
 # appending the record of each employee to
            # the main dictionary
            dict1[sno] = dict2
            l = l + 1
# creating json file
            out_file = open("pdf.json", 'w', encoding="utf-8", errors='ignore')
            json.dump(dict1, out_file, indent=4)
            out_file.close()
except Exception as err:
    print(err)