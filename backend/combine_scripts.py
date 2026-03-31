import os
import re

dir_path = r"c:\Users\Backer\Desktop\SeSAC_Backer\SESAC_최종프로젝트\Final_Project\backend\src\main\resources\db\migration"
files = [f for f in os.listdir(dir_path) if f.endswith(".sql")]

def get_version(filename):
    match = re.match(r'V(\d+)', filename)
    if match:
        return int(match.group(1))
    return 9999

files.sort(key=get_version)

output_file = "all_in_one.sql"

with open(output_file, "w", encoding="utf-8") as outfile:
    outfile.write("-- ALL IN ONE MIGRATION SCRIPT\n")
    outfile.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")
    
    for filename in files:
        outfile.write(f"-- ==========================================\n")
        outfile.write(f"-- START: {filename}\n")
        outfile.write(f"-- ==========================================\n")
        with open(os.path.join(dir_path, filename), "r", encoding="utf-8") as infile:
            content = infile.read()
            outfile.write(content)
            if not content.endswith('\n'):
                outfile.write('\n')
        outfile.write(f"-- END: {filename}\n\n")
    
    outfile.write("SET FOREIGN_KEY_CHECKS = 1;\n")

print(f"Successfully combined {len(files)} files into {output_file}")
