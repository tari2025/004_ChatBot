document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const chatBox = document.getElementById("chatBox");

    // Fungsi untuk menambahkan pesan ke layar
    function appendMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        
        if (sender === "user") {
            messageDiv.classList.add("user-message");
        } else {
            messageDiv.classList.add("bot-message");
        }

        const p = document.createElement("p");
        p.textContent = text;
        messageDiv.appendChild(p);
        chatBox.appendChild(messageDiv);

        // Auto-scroll ke bawah
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Event listener saat form di-submit (tombol kirim ditekan)
    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // Mencegah reload halaman

        const userMessage = messageInput.value.trim();
        if (!userMessage) return; // Jangan kirim jika kosong

        // Tampilkan pesan user di layar
        appendMessage(userMessage, "user");
        messageInput.value = ""; // Kosongkan input

        try {
            // Tampilkan pesan loading sementara (opsional)
            const loadingId = "loading-" + Date.now();
            const loadingDiv = document.createElement("div");
            loadingDiv.classList.add("message", "bot-message");
            loadingDiv.id = loadingId;
            loadingDiv.innerHTML = "<p>Typing...</p>";
            chatBox.appendChild(loadingDiv);
            chatBox.scrollTop = chatBox.scrollHeight;

            // Kirim request ke backend API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                // Format array sesuai dengan yang diminta backend Anda
                body: JSON.stringify({
                    message: [
                        { role: "user", content: userMessage }
                    ]
                })
            });

            // Hapus pesan loading
            document.getElementById(loadingId).remove();

            if (!response.ok) {
                const errorData = await response.json();
                appendMessage("Error: " + (errorData.error || "Gagal menghubungi server"), "bot");
                return;
            }

            // --- BAGIAN INI JIKA MENGGUNAKAN STREAMING ---
            // Karena backend Anda menggunakan stream: true, kita perlu membaca response sebagai stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            // Buat elemen untuk menampung balasan bot yang akan di-update terus menerus
            const botMessageDiv = document.createElement("div");
            botMessageDiv.classList.add("message", "bot-message");
            const botTextP = document.createElement("p");
            botMessageDiv.appendChild(botTextP);
            chatBox.appendChild(botMessageDiv);
            
            let botFullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
                    
                    const dataStr = trimmedLine.slice(6); // Hapus "data: "
                    if (dataStr === "[DONE]") break;

                    try {
                        const dataJson = JSON.parse(dataStr);
                        if (dataJson.content) {
                            botFullText += dataJson.content;
                            botTextP.textContent = botFullText;
                            chatBox.scrollTop = chatBox.scrollHeight;
                        }
                    } catch (err) {
                        console.error("Gagal parse stream", err);
                    }
                }
            }

        } catch (error) {
            console.error("Error:", error);
            appendMessage("Terjadi kesalahan jaringan.", "bot");
        }
    });
});