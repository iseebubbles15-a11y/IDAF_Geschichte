
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

text = "Hello there"

def encrypt(plaintext: str, shift: int):
    ciphertext = ""
    for character in plaintext:

        # if the character is not a letter but a space or a number, add it to the result directly
        if not character.upper() in LETTERS:
            ciphertext += character
            continue
        
        # get the index and turn the letter into uppercase since operations are case-sensitive and LETTERS only
        # contains uppercase letters
        letter_index = LETTERS.index(character.upper()) 

        # calculate new index
        letter_index_shifted = letter_index + shift

        # now it might be out of range so we need to wrap around 
        # [A, B, ..., Y, Z] -> Index 20 = U -> Index of 20 + Shift of 10 = 30, but list indexes only go up to
        # 25 (first element has an index of 0). To do this we use the modulo operator which is essentially 
        # "divide by and return the remainder"
        letter_index_shifted = letter_index_shifted % len(LETTERS) # mod by the amount of numbers in LETTERS

        # now we need to get the letter from the shifted index and add it to the ciphertext string
        ciphertext_letter = LETTERS[letter_index_shifted]

        # differentiate between upper- and lowercase letters, 
        if character.isupper():
            ciphertext += ciphertext_letter
        else:
            ciphertext += ciphertext_letter.lower()

    # after we're done, return the ciphertext
    return ciphertext

ciphertext = encrypt(text, 3)
print(ciphertext)
