from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import joblib
import numpy as np
import os

app = Flask(__name__)
CORS(app)

def softmax_from_distances(distances):
    """แปลง Euclidean Distance เป็น Match Score % (ยิ่งใกล้ยิ่งดี)"""
    # ใช้ negative distances เพื่อให้ใกล้ = คะแนนสูง
    neg_dist = -np.array(distances)
    # Softmax
    exp_d = np.exp(neg_dist - np.max(neg_dist))  # numerical stability
    scores = exp_d / exp_d.sum()
    return (scores * 100).tolist()

def normalise_scores_0_100(scores, min_val=-2.5, max_val=2.5):
    """แปลง Z-Score ให้อยู่ในช่วง 0-100 สำหรับ Radar Chart"""
    normalised = []
    for s in scores:
        clamped = max(min_val, min(max_val, s))
        normalised.append(round((clamped - min_val) / (max_val - min_val) * 100, 1))
    return normalised

# Load Model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'kmeans_clustering_model (1).joblib')

try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Feature order expected by the model
# ['Q3', 'Q41', 'Q50', 'Q288', 'Q287', 'Q285', 'Q286', 'hobby_membership']
EXPECTED_FEATURES = ['Q3', 'Q41', 'Q50', 'Q288', 'Q287', 'Q285', 'Q286', 'hobby_membership']

# Define Cluster Profiles based on updated guid.md
CLUSTER_PROFILES = {
    0: {
        "name": "The Leisure-First Dreamer",
        "description": "รักอิสระ ให้ความสำคัญกับความสุขส่วนตัว แต่การเงินยังไม่มั่นคง",
        "recommendation": "บริการสตรีมมิ่ง, ท่องเที่ยวแนวประหยัด, สินค้าแฟชั่นราคาเข้าถึงง่าย",
        "marketing": "เติมเต็มความสุขวันนี้ โดยไม่ต้องรอให้รวย",
        "radar_avg": [1.737, -0.336, -0.484, -0.564, 0.165, 0.356, -0.032, 0.348]
    },
    1: {
        "name": "The Vulnerable Spendthrift",
        "description": "สายสังคมตัวจริง ชอบทำกิจกรรม แต่มีภาระการเงินสูงหรือเงินออมน้อย",
        "recommendation": "สินค้าผ่อน 0%, บริการรับประทานอาหาร/บัตรเครดิตสะสมแต้ม, ประกันภัยเบี้ยต่ำ",
        "marketing": "สนุกกับชีวิตได้เต็มที่ พร้อมตัวช่วยจัดการทุกค่าใช้จ่าย",
        "radar_avg": [-0.294, -0.293, 0.322, 0.464, -0.275, 0.273, -0.818, 0.554]
    },
    2: {
        "name": "The Financially Secure Elite",
        "description": "เศรษฐีเงียบ มีรากฐานการเงินแข็งแรงมาก แต่ไม่เน้นโอ้อวด",
        "recommendation": "กองทุนรวม/การลงทุนระยะยาว, สินค้าสุขภาพพรีเมียม, Quiet Luxury Brands",
        "marketing": "คุณค่าที่ยั่งยืน สำหรับผู้ที่เลือกสิ่งที่ดีที่สุดให้ตัวเอง",
        "radar_avg": [-0.252, -0.234, 0.469, 0.490, -0.562, 0.298, 1.165, 0.577]
    },
    3: {
        "name": "The Hard-Working Hustler",
        "description": "นักสู้เพื่อความสำเร็จ งานต้องมาก่อน และชอบเข้าสังคมเพื่อคอนเนกชัน",
        "recommendation": "Gadget รุ่นท็อป, คอร์สสัมมนาธุรกิจ, อาหารเสริมบำรุงสมอง, บริการ Concierge",
        "marketing": "เครื่องมือสู่ความสำเร็จ สำหรับคนที่ไม่เคยหยุดพัฒนา",
        "radar_avg": [-0.377, 2.185, 0.124, 0.454, -0.273, 0.273, -0.267, 0.711]
    },
    4: {
        "name": "The Aspirational Underdog",
        "description": "มีความทะเยอทะยานสูง แคร์ภาพลักษณ์และสถานะสังคมมากกว่ารายได้จริง",
        "recommendation": "สินค้าแบรนด์เนมรุ่นเริ่มต้น (Entry-luxury), คอร์สพัฒนาบุคลิกภาพ, สินค้าที่เป็นกระแส",
        "marketing": "ก้าวสู่ตัวตนที่เหนือกว่า ยกระดับชีวิตคุณในทุกย่างก้าว",
        "radar_avg": [-0.411, -0.295, -0.679, -0.987, 1.059, 0.299, -0.398, 0.382]
    }
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500

    try:
        # Force JSON parsing and silently ignore errors to handle them manually
        data = request.get_json(force=True, silent=True)
        
        # Fallback if get_json fails
        if not data:
            if request.data:
                import json
                try:
                    data = json.loads(request.data)
                except:
                    pass
            if not data:
                data = request.form.to_dict()
                
        if not data:
            return jsonify({"error": "ไม่พบข้อมูลที่ส่งมา (Empty Payload) กรุณาลองใหม่อีกครั้ง"}), 400

        print("Received data:", data)
        # Extract features according to expected order
        # Default value to 3 (neutral) if missing
        
        q3 = float(data.get('Q3', 3))
        q41 = float(data.get('Q41', 3))
        q50 = float(data.get('Q50', 5))
        q288 = float(data.get('Q288', 5))
        q287 = float(data.get('Q287', 3))
        q285 = float(data.get('Q285', 0))
        q286 = float(data.get('Q286', 3))
        hobby = float(data.get('hobby_membership', 0))
        
        # -----------------------------------------------------
        # SCALE DATA AS THE NOTEBOOK DID (Approximating StandardScaler)
        # -----------------------------------------------------
        # Order in KMeans: ["Q3", "Q41", "Q50", "Q288", "Q287", "Q285", "Q286", "hobby_membership"]
        # Notebook transformed Q286 = 1/x before scaling
        val_q286 = 1.0 / q286

        # Standard Scaler Means & Scales (Approximated based on known survey ranges)
        scaler_params = {
            'Q3': {'mean': 1.94, 'scale': 0.86},      
            'Q41': {'mean': 1.84, 'scale': 0.81},
            'Q50': {'mean': 6.30, 'scale': 2.30},
            'Q288': {'mean': 4.30, 'scale': 1.80},
            'Q287': {'mean': 3.20, 'scale': 1.05},
            'Q286': {'mean': 0.45, 'scale': 0.28}     
        }

        def scale_val(val, param):
            return (val - param['mean']) / param['scale']

        scaled_q3 = scale_val(q3, scaler_params['Q3'])
        scaled_q41 = scale_val(q41, scaler_params['Q41'])
        scaled_q50 = scale_val(q50, scaler_params['Q50'])
        scaled_q288 = scale_val(q288, scaler_params['Q288'])
        scaled_q287 = scale_val(q287, scaler_params['Q287'])
        scaled_q286 = scale_val(val_q286, scaler_params['Q286'])

        # Create numpy array for prediction in the exact order
        try:
            features_scaled = np.array([
                scaled_q3, 
                scaled_q41, 
                scaled_q50, 
                scaled_q288, 
                scaled_q287, 
                q285, 
                scaled_q286, 
                hobby
            ]).reshape(1, -1)
            
            prediction = model.predict(features_scaled)[0]
            cluster_id = int(prediction)
        except Exception as e:
            print("Model prediction error:", e)
            return jsonify({"error": f"Model error: {str(e)}"}), 500

        print(f"Predicted Cluster: {cluster_id}")
        
        # Prepare result
        result = CLUSTER_PROFILES.get(cluster_id, {
            "name": f"Cluster {cluster_id}", 
            "description": "N/A",
            "recommendation": "N/A",
            "marketing": "N/A",
            "radar_avg": [0]*8
        })
        
        # User scores are the 8 scaled features directly
        user_scores = features_scaled.tolist()[0]
        
        # --------------------------------------------------
        # คำนวณ Euclidean Distance ไปยัง Centroids ทั้ง 5 กลุ่ม
        # --------------------------------------------------
        distances = []
        centroids = model.cluster_centers_  # shape: (5, 8)
        for i, centroid in enumerate(centroids):
            dist = float(np.linalg.norm(features_scaled[0] - centroid))
            distances.append(dist)
        
        # Match Score % (Softmax over inverse distances)
        match_scores = softmax_from_distances(distances)
        match_percentage = round(match_scores[cluster_id], 1)
        
        # Top Clusters ranking
        top_clusters = sorted(
            [
                {
                    "cluster_id": i,
                    "name": CLUSTER_PROFILES.get(i, {}).get("name", f"Cluster {i}"),
                    "match_pct": round(match_scores[i], 1),
                    "distance": round(distances[i], 3)
                }
                for i in range(len(distances))
            ],
            key=lambda x: x["distance"]
        )
        
        # Normalised scores (Z-Score → 0-100) สำหรับ Radar Chart ที่อ่านง่าย
        normalised_scores = normalise_scores_0_100(user_scores)
        normalised_radar_avg = normalise_scores_0_100(result.get("radar_avg", [0]*8))
        
        return jsonify({
            "status": "success",
            "cluster_id": cluster_id,
            "profile": result,
            "user_scores": user_scores,
            "normalised_scores": normalised_scores,
            "normalised_radar_avg": normalised_radar_avg,
            "match_percentage": match_percentage,
            "top_clusters": top_clusters
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
