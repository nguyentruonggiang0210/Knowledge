# Lesson 23 — NLP, tokenization, embeddings và sequences

## Mục tiêu

Bạn sẽ hiểu pipeline NLP từ Unicode text tới token id, vector và batch sequence; biết khác biệt giữa word/subword tokenization, sparse/contextual embedding, padding và attention mask.

## Bản chất và cách hoạt động

Text cần được normalize có chủ đích. Tiếng Việt dùng Unicode và dấu mang nghĩa, nên xóa dấu bừa bãi làm mất thông tin. Tokenizer biến chuỗi thành đơn vị; word tokenizer dễ hiểu nhưng gặp out-of-vocabulary, còn BPE/WordPiece học subword từ corpus.

Embedding ánh xạ token hoặc câu vào vector. TF-IDF là sparse representation dựa trên tần suất; learned embedding là dense vector. Contextual embedding còn thay đổi theo ngữ cảnh. Similarity cao chỉ là tín hiệu gần về biểu diễn, không đảm bảo cùng sự thật.

Sequence trong một batch thường được pad cùng độ dài. Mask đánh dấu token thật và padding để model không học hoặc attention vào phần giả.

## Khi dùng

- Phân loại ticket, semantic search, clustering và đầu vào Transformer.
- Chuẩn hóa text đa ngôn ngữ.
- Batching câu có độ dài khác nhau.

## Khi không dùng

- Không xóa dấu/stopword máy móc khi chúng ảnh hưởng intent.
- Không so vector từ hai model hoặc hai version như cùng một không gian.
- Không đưa PII thô vào embedding store nếu chưa có policy phù hợp.

## Ví dụ thực tế

Hai ticket “không thể đăng nhập tài khoản” và “lỗi đăng nhập mật khẩu” phải gần nhau hơn một ticket hóa đơn. Sau tokenization, chuỗi token id được pad và tạo mask trước khi vào model.

## Demo

~~~powershell
python .\Lessions\23-nlp-tokenization-embeddings-sequences\src\demo.py
~~~

## Bài tập

1. Thêm bigram vào TF-IDF.
2. Cài một vòng merge BPE nhỏ.
3. Bổ sung token UNK/BOS/EOS.
4. So sánh truncation đầu, cuối và cửa sổ trượt cho ticket dài.

## Checklist

- [ ] Unicode normalization được kiểm thử bằng text tiếng Việt.
- [ ] Tokenizer/version là một phần của model artifact.
- [ ] Train và inference dùng cùng preprocessing.
- [ ] Padding mask đúng với token id.
- [ ] Đánh giá retrieval theo dữ liệu thật, không chỉ nhìn cosine.

## Bài trước và bài sau

- Bài trước: Lesson 22 — computer vision và CNN.
- Bài sau: Lesson 24 — attention và Transformer.
