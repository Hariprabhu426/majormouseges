from flask import Flask, render_template, request, jsonify
import pyautogui

app = Flask(__name__)

# Screen size
screen_w, screen_h = pyautogui.size()

# Optional: small delay safety
pyautogui.FAILSAFE = False


@app.route('/')
def index():
    return render_template('index.html')


# 🔥 MOVE (SMOOTHED INPUT FROM FRONTEND)
@app.route('/move', methods=['POST'])
def move():
    try:
        data = request.json
        print("MOVE:", data)

        x = int(data['x'] * screen_w)
        y = int(data['y'] * screen_h)

        pyautogui.moveTo(x, y, duration=0.1)  # smoother movement

        return jsonify({"status": "ok"})
    
    except Exception as e:
        print("ERROR in MOVE:", e)
        return jsonify({"status": "error"})


# 🔥 LEFT CLICK
@app.route('/click', methods=['POST'])
def click():
    try:
        print("LEFT CLICK")
        pyautogui.click()
        return jsonify({"status": "clicked"})
    
    except Exception as e:
        print("ERROR in CLICK:", e)
        return jsonify({"status": "error"})


# 🔥 RIGHT CLICK (NEW)
@app.route('/right_click', methods=['POST'])
def right_click():
    try:
        print("RIGHT CLICK")
        pyautogui.rightClick()
        return jsonify({"status": "right clicked"})
    
    except Exception as e:
        print("ERROR in RIGHT CLICK:", e)
        return jsonify({"status": "error"})


# 🔥 SCROLL (NEW)
@app.route('/scroll', methods=['POST'])
def scroll():
    try:
        data = request.json
        print("SCROLL:", data)

        scroll_value = data.get('scroll', 0)

        # 🔥 direct control (BEST for gesture mouse)
        pyautogui.scroll(int(scroll_value))

        return jsonify({"status": "scroll ok"})

    except Exception as e:
        print("ERROR in SCROLL:", e)
        return jsonify({"status": "error"})



if __name__ == '__main__':
    app.run(debug=True)