# -*- coding: utf-8 -*- 

import os
import csv
import torch
import torch.nn as nn
import torch.optim as optim 

# -------------------------
# إعداد الملفات
# -------------------------
foods = ["بيتزا", "سلطه", "كتكوت", "طماط", "بقره", "بيبار", "سمكة", "جزر", "جمبري", "ذرة"]
data_file = "data.csv"
acc_file = "accuracy.txt"
model_file = "best_model.pth" 

if not os.path.exists(data_file):
    with open(data_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["food"]) 

# -------------------------
# إدخال جولة جديدة
# -------------------------
new_round = """
جمبري طماط ذرة جزر بيبار طماط بيبار ذرة بيبار ذرة بيبار جمبري بقره بيبار طماط بيبار جزر جزر
جزر ذرة بيبار جزر بيبار بيبار ذرة جزر بيبار بيبار جزر طماط جزر سمكة ذرة ذرة ذرة بيبار كتكوت
ذرة بيبار ذرة جمبري جزر بيبار بقره سمكة سمكة طماط ذرة جزر ذرة جزر بيبار جزر جزر جزر بيبار
ذرة بيبار بقره جزر جزر طماط ذرة جزر بيبار طماط كتكوت ذرة جمبري جمبري جمبري جمبري جمبري
ذرة بيبار سمكة جزر جزر طماط بيبار جمبري ذرة طماط جمبري جمبري طماط بقره جمبري ذرة بيبار
طماط سمكة بقره ذرة سمكة جزر جزر طماط سمكة ذرة طماط ذرة سمكة بقره جزر طماط بقره جمبري
جزر بيبار جزر ذرة جزر طماط بقره ذرة ذرة ذرة بقره طماط طماط جزر بيبار طماط طماط طماط
ذرة سمكة بقره بيبار جمبري جزر جمبري طماط بيبار ذرة بيبار ذرة ذرة طماط جزر جزر ذرة طماط
ذرة طماط طماط ذرة طماط بقره ذرة طماط بيبار طماط بقره كتكوت ذرة جزر جزر جزر بقره بيبار
ذرة جزر جزر طماط ذرة جمبري طماط ذرة بيبار جزر جزر جزر جزر طماط بيبار طماط جزر بيبار جزر
ذرة ذرة بيبار بقره جزر بيبار ذرة بقره طماط بيبار طماط طماط جزر ذرة طماط جزر طماط بيبار
سمكة طماط جزر جزر بيبار بيبار جمبري بيبار جمبري جزر سمكة جزر ذرة سمكة طماط سلطه ذرة طماط
ذرة جزر طماط جمبري بيبار جزر طماط ذرة بيبار ذرة بيبار طماط طماط ذرة بيبار جزر جمبري طماط
طماط جزر جمبري بقره جزر ذرة طماط ذرة بقره بيبار بيبار بيبار ذرة بيبار بقرة طماط بقره
كتكوت جمبري جزر بقره طماط طماط بيبار جزر طماط جمبري ذرة بيبار جزر سمكة جمبري طماط طماط
طماط جمبري جمبري بقره بيبار بيبار بيبار طماط جمبري طماط بقره جمبري ذرة بقره ذرة جمبري
جمبري بيبار ذرة جزر طماط طماط بيبار بيبار سمكة جزر طماط بيبار جمبري بيبار سمكة ذرة طماط
ذرة جزر طماط جزر جمبري بقره طماط بيبار بيبار سمكة بيبار جزر طماط بقره بيبار جمبري بيبار
ذرة طماط طماط جزر ذرة بقره ذرة ذرة جزر طماط جمبري ذرة طماط طماط طماط بقره ذرة طماط جزر
بيبار طماط طماط جزر طماط سمكة جمبري سمكة بيبار طماط بقره ذرة بيبار جزر ذرة ذرة بيبار بقره
جزر جزر ذرة بقره جزر ذرة جزر بيبار جزر كتكوت بيبار ذرة جزر سمكة جزر طماط بيبار جزر بقره
ذرة جزر بيبار سمكة بيبار بقره طماط بيبار بيبار بيبار بيبار ذرة بيبار بيبار جزر جزر جزر
ذرة ذرة ذرة جزر طماط جزر ذرة سمكة بقره ذرة جزر جمبري جمبري جزر طماط بيبار طماط بيبار
سمكة طماط جزر سمكة بيبار ذرة جزر بيبار ذرة جمبري طماط جمبري بقره طماط سمكة جزر طماط
طماط طماط سمكة طماط طماط جزر ذرة طماط سمكة بيبار
""".replace("\n"," ").split()  # 

with open(data_file, "a", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    for food in new_round:
        if food in foods:
            writer.writerow([food]) 

print("✅ تمت إضافة الجولة الجديدة") 

# -------------------------
# تحميل البيانات
# -------------------------
dataset = []
with open(data_file, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        dataset.append(row["food"]) 

print("📊 عدد العينات في قاعدة البيانات:", len(dataset)) 

# -------------------------
# شبكة عصبية
# -------------------------
class FoodPredictor(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super(FoodPredictor, self).__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_size) 

    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out 

# ترميز الأطعمة
food_to_idx = {food: i for i, food in enumerate(foods)}
idx_to_food = {i: food for i, food in enumerate(foods)} 

X, Y = [], []
for i in range(len(dataset) - 1):
    x = food_to_idx[dataset[i]]
    y = food_to_idx[dataset[i + 1]]
    X.append(x)
    Y.append(y) 

X = torch.tensor(X)
Y = torch.tensor(Y)
X_onehot = torch.nn.functional.one_hot(X, num_classes=len(foods)).float() 

# إعداد النموذج
model = FoodPredictor(len(foods), 128, len(foods))
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.01) 

# -------------------------
# تحميل أفضل دقة سابقة
# -------------------------
best_accuracy = 0.0
if os.path.exists(acc_file):
    with open(acc_file, "r", encoding="utf-8") as f:
        try:
            best_accuracy = float(f.read().strip())
        except:
            best_accuracy = 0.0 

print(f"📌 أفضل دقة سابقة: {best_accuracy:.2f}%") 

# -------------------------
# تحميل أفضل وزن سابق
# -------------------------
if os.path.exists(model_file):
    model.load_state_dict(torch.load(model_file))
    print("📂 تم تحميل أفضل نموذج سابق من", model_file) 

# -------------------------
# التدريب
# -------------------------
total_epochs = 200
print_interval = 50  # الطباعة كل 50 عصر 

for epoch in range(1, total_epochs + 1):
    outputs = model(X_onehot)
    loss = criterion(outputs, Y) 

    _, predicted = torch.max(outputs, 1)
    correct = (predicted == Y).sum().item()
    accuracy = 100 * correct / len(Y) 

    optimizer.zero_grad()
    loss.backward()
    optimizer.step() 

    if epoch % print_interval == 0 or epoch == total_epochs:
        print(f"Epoch [{epoch}/{total_epochs}], Loss: {loss.item():.4f}, Accuracy: {accuracy:.2f}%") 

    if accuracy > best_accuracy:
        best_accuracy = accuracy
        with open(acc_file, "w", encoding="utf-8") as f:
            f.write(str(best_accuracy))
        torch.save(model.state_dict(), model_file)
        print(f"🔥 تم تسجيل أفضل دقة جديدة: {best_accuracy:.2f}% وحفظ النموذج!") 

# -------------------------
# توقع الجولة القادمة لكل طعام في قاعدة البيانات
# -------------------------
model.eval()  # وضع النموذج في وضع التقييم
with torch.no_grad():
    print("\n🔮 توقع الجولة التالية لكل طعام في قاعدة البيانات:")
    for food in foods:
        test_idx = food_to_idx[food]
        test_input = torch.nn.functional.one_hot(torch.tensor([test_idx]), num_classes=len(foods)).float()
        prediction = model(test_input)
        probabilities = torch.softmax(prediction, dim=1)[0]
        top3 = torch.topk(probabilities, 3)  # أعلى 3 توقعات 

        print(f"\n🍽 {food} ➝ التوقعات القادمة:")
        for i in range(3):
            food_name = idx_to_food[top3.indices[i].item()]
            prob = top3.values[i].item() * 100
            print(f"   {i+1}. {food_name} ({prob:.2f}%)")
