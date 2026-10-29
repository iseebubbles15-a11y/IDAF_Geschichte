from time import perf_counter

# a benchmark to showcase how fast the bruteforce is

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

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

# test 10'000 times
def test(text: str):
    result = 0.0
    for _ in range(10_000):
        start = perf_counter()
        bruteforce(text)
        end = perf_counter()
        time_taken_microseconds = (end - start)*1_000_000
        result += time_taken_microseconds
    result /= 10_000
    return result

start = perf_counter()

words = test("SHORT TEXT")
sentence = test("Lorem ipsum dolor sit amet, consectetur adipiscing")
paragraph = test("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.")
page = test("""Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.
                """)

end = perf_counter()
total = (end-start)

print("Decoded varying texts 10'000 times at the following speeds:")
print(f"Two words:\t{words:0.3f} µs")
print(f"One Sentence:\t{sentence:0.3f} µs")
print(f"One Paragraph:\t{paragraph:0.3f} µs")
print(f"One Page:\t{page:0.3f} µs")
print(f"\nTested in {total:.2f} seconds")

# OUTPUT:
#Decoded varying texts 10'000 times at the following speeds:
#Two words:      41.553 µs
#One Sentence:   211.106 µs
#One Paragraph:  1838.559 µs
#One Page:       9249.104 µs
#
#Tested in 113.40 seconds