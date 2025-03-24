from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
import time

# 🚀 Start the WebDriver (Make sure you have ChromeDriver installed)
driver = webdriver.Chrome()

# 🔹 Open your deployed website
driver.get("https://evchargerlocator.vercel.app/")

# Wait for the page to load
time.sleep(3)

# 🔹 Click the Login button
try:
    login_button = driver.find_element(By.LINK_TEXT, "Login")  # Change selector if needed
    login_button.click()
    print("✅ Successfully clicked Login button.")
except:
    print("❌ Login button not found.")

# Wait for redirection
time.sleep(3)

# 🔹 Check if on login page
if "auth.html" in driver.current_url:
    print("✅ Successfully navigated to login page!")
else:
    print("❌ Login page not reached.")

# Close the browser
driver.quit()
