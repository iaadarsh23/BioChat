import requests


def getWeather(city : str):
    url = f"https://wttr.in/{city.lower()}?format=%C+%t"
    response = requests.get(url)
    if response.status_code == 200:
        return f"the weather is in {city} is {response.text}"
    
    return "There is something wrong"

city = input("> ")
print(getWeather(city))
