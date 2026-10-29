from time import perf_counter

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

ciphertext = "Khoor wkhuh"


# for this we can keep the logic largely the same, but I've moved
# the logic to shift the letter to a separate function to make it
# more readable


def shift_character(character: str, shift: int):
        # if the character is not a letter but a space or a number, return it directly
        if not character.upper() in LETTERS:
            return character
        
        # get the index and turn the letter into uppercase since operations are case-sensitive and LETTERS only
        # contains uppercase letters
        letter_index = LETTERS.index(character.upper()) 

        # calculate new index, shifting backwards now since we're decrypting
        letter_index_shifted = letter_index - shift

        # now it might be out of range so we need to wrap around 
        # [A, B, ..., Y, Z] -> Index 20 = U -> Index of 20 + Shift of 10 = 30, but list indexes only go up to
        # 25 (first element has an index of 0). To do this we use the modulo operator which is essentially 
        # "divide by and return the remainder"
        letter_index_shifted = letter_index_shifted % len(LETTERS) # mod by the amount of numbers in LETTERS

        # now we need to get the letter from the shifted index and add it to the ciphertext string
        ciphertext_letter = LETTERS[letter_index_shifted]

        # differentiate between upper- and lowercase letters, 
        if character.isupper():
            return ciphertext_letter
        else:
            return ciphertext_letter.lower()

def bruteforce(ciphertext: str):
    possible_plaintexts = []

    # iterate through all sensible keys 
    # (excluding 0 because and 26 because they land back on
    # the same letter)
    for shift in range(1, 26):
        plaintext = ""

        # shift the string by the current guessed key
        for character in ciphertext:
            plaintext += shift_character(character, shift)

        # add the guessed plaintext to the list
        possible_plaintexts.append(plaintext)
    
    # after we've tried all keys, return the list
    return possible_plaintexts

def decrypt(ciphertext: str, shift: int = None):
    if shift == None:
        # since we don't know the shift we'll just guess
        # we could do frequency analysis, but since there's
        # only 25 possible keys it's not really worth it and
        # faster to just try them all.

        # time measurements are to display how quickly the key can be guessed
        start_time = perf_counter()
        possible_plaintexts = bruteforce(ciphertext)
        finish_time = perf_counter()

        # print all possible solutions with their respective keys
        for possible_plaintext_index in range(len(possible_plaintexts)):
            print(f"Key {possible_plaintext_index + 1}:\t{possible_plaintexts[possible_plaintext_index]}")
            # -> "Key x:    Text"
        
        time_taken = finish_time - start_time
        print(f"\nAll keys bruteforced in {time_taken*1_000_000:.3f} µs")
    else:
        # since we know the key we only need to decrypt it once
        plaintext = ""

        # shift the string by the given key
        for character in ciphertext:
            plaintext += shift_character(character, shift)

        print(f"Key {shift}:\t{plaintext}")
        # -> "Key x:    Text"


decrypt(ciphertext)
