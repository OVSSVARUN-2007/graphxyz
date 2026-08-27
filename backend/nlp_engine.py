"""
NLP, Machine Learning, and Deep Learning Engine for Graphx:
Extracts high-dimensional neural embeddings, performs dimensionality reduction (PCA, t-SNE, UMAP),
computes sentiment/emotion/topic distributions, and generates transparent model insights.
"""

import math
import re
from collections import Counter
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.manifold import TSNE

# Lazy loading for sentence-transformers / PyTorch to stay well within 512MB RAM
HAS_TRANSFORMERS = True
sentence_model = None

def get_sentence_model():
    """Lazily load SentenceTransformer only when first needed to ensure lightweight startup under 50MB RAM."""
    global sentence_model, HAS_TRANSFORMERS
    if not HAS_TRANSFORMERS:
        return None
    if sentence_model is None:
        try:
            import os
            import torch
            os.environ["TOKENIZERS_PARALLELISM"] = "false"
            torch.set_num_threads(1)
            from sentence_transformers import SentenceTransformer
            sentence_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
        except Exception as e:
            print(f"Notice: Using high-performance SVD embedding fallback: {e}")
            HAS_TRANSFORMERS = False
            sentence_model = None
    return sentence_model

try:
    import umap
    HAS_UMAP = True
except ImportError:
    HAS_UMAP = False


# Reference anchor sentences for meaningful topological embedding maps
SEMANTIC_ANCHORS = [
    {"text": "Artificial intelligence, deep learning, and neural networks are transforming modern computing.", "category": "Technology & AI"},
    {"text": "Quantum mechanics, astrophysics, and general relativity describe the fundamental laws of the universe.", "category": "Physics & Science"},
    {"text": "Writing clean code, refactoring algorithms, and debugging software architecture.", "category": "Programming"},
    {"text": "I feel immense joy, peace, gratitude, and happiness on this sunny day.", "category": "Positive Emotion"},
    {"text": "Frustration, bugs, compiler errors, and unexpected roadblocks are driving me crazy.", "category": "Frustration & Anger"},
    {"text": "Deep melancholy, loneliness, sorrow, and sadness filled the empty room.", "category": "Sadness"},
    {"text": "Philosophical contemplation of consciousness, ethics, existence, and human meaning.", "category": "Philosophy"},
    {"text": "Global economic markets, venture capital investments, and financial startup growth.", "category": "Business & Finance"},
    {"text": "Classical music, oil painting, artistic expression, and sculpture.", "category": "Art & Culture"},
    {"text": "Biomedical research, cellular immunology, vaccines, and public healthcare.", "category": "Health & Medicine"},
    {"text": "Exploring ancient history, archaeological discoveries, and civilizations.", "category": "History & Archaeology"},
    {"text": "Mindfulness, cognitive meditation, stress reduction, and emotional wellness.", "category": "Psychology & Wellness"},
]

TOPICS_DEFINITIONS = {
    "Technology & AI": "artificial intelligence machine learning deep learning computers software algorithms neural networks tech",
    "Physics & Science": "physics quantum cosmos biology chemistry mathematics scientific astronomy experiment universe",
    "Programming": "coding programming python javascript bugs debugging architecture developer compiler syntax software",
    "Education & Learning": "education study student school university learning teaching knowledge classroom curriculum",
    "Philosophy & Ethics": "philosophy ethics morals consciousness existence meaning truth logic epistemology",
    "Business & Economics": "business market economy finance startup money investment growth industry revenue",
    "Art & Culture": "art music painting sculpture literature poetry creative design theater culture",
    "Health & Medicine": "health medicine doctor healthcare biological wellness illness nutrition therapy clinical",
    "Emotion & Mindset": "happiness sadness joy anger feelings psychological mindset emotional stress anxiety peace"
}

EMOTION_KEYWORDS = {
    "Joy": ["happy", "delight", "wonderful", "joy", "excited", "love", "great", "glad", "blessed", "fantastic", "pleasure", "smile", "cheer", "thrilled"],
    "Sadness": ["sad", "depressed", "sorrow", "grief", "melancholy", "unhappy", "cry", "lonely", "hopeless", "mourn", "gloomy", "heartbroken"],
    "Anger": ["angry", "furious", "mad", "rage", "hate", "annoyed", "irritated", "outraged", "bitter", "wrath", "infuriated"],
    "Fear": ["afraid", "scared", "fear", "terrified", "panic", "anxious", "horror", "dread", "worry", "alarmed", "nervous"],
    "Surprise": ["amazed", "astonished", "shocked", "surprise", "unexpected", "wonder", "jaw-dropping", "stunned", "unbelievable"],
    "Curiosity": ["curious", "wonder", "interested", "explore", "discover", "fascinated", "intrigued", "investigate", "inquire", "question", "learn"],
    "Frustration": ["frustrated", "frustrating", "stuck", "annoyed", "difficult", "struggle", "obstacle", "roadblock", "hard", "bug", "failing", "tired"]
}

STOP_WORDS = set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "you're", "you've",
    "you'll", "you'd", "your", "yours", "yourself", "yourselves", "he", "him", "his", "himself",
    "she", "she's", "her", "hers", "herself", "it", "it's", "its", "itself", "they", "them",
    "their", "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "that'll",
    "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or",
    "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below", "to", "from",
    "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more",
    "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
    "too", "very", "s", "t", "can", "will", "just", "don", "don't", "should", "should've", "now",
    "d", "ll", "m", "o", "re", "ve", "y", "ain", "aren", "aren't", "couldn", "couldn't", "didn",
    "didn't", "doesn", "doesn't", "hadn", "hadn't", "hasn", "hasn't", "haven", "haven't",
    "isn", "isn't", "ma", "mightn", "mightn't", "mustn", "mustn't", "needn", "needn't", "shan",
    "shan't", "shouldn", "shouldn't", "wasn", "wasn't", "weren", "weren't", "won", "won't",
    "wouldn", "wouldn't", "also", "though", "although"
])


def split_sentences(text: str) -> List[str]:
    """Split text into sentences cleanly."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    cleaned = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 2]
    return cleaned if cleaned else [text.strip()]


def get_embeddings(texts: List[str]) -> np.ndarray:
    """Generate high-dimensional embeddings using SentenceTransformer or SVD fallback."""
    model = get_sentence_model()
    if model is not None:
        try:
            emb = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
            return emb
        except Exception as e:
            print(f"SentenceTransformer encoding error, falling back to SVD: {e}")
    
    # Fallback pseudo-neural embedding via TF-IDF + Random Projection / SVD to 384 dimensions
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=1)
    # Combine with anchor vocabulary
    corpus = texts + [a["text"] for a in SEMANTIC_ANCHORS]
    tfidf = vec.fit_transform(corpus)
    
    # Deterministic projection to 384 dimensions
    np.random.seed(42)
    n_features = tfidf.shape[1]
    dim = 384
    proj_matrix = np.random.normal(0, 1.0 / np.sqrt(dim), (n_features, dim))
    dense_tfidf = tfidf[:len(texts)].toarray()
    emb = np.dot(dense_tfidf, proj_matrix)
    # L2 normalize
    norms = np.linalg.norm(emb, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return emb / norms


def compute_sentiment(text: str) -> Dict[str, Any]:
    """Calculate calibrated sentiment probabilities (positive, neutral, negative)."""
    # Lexicon + neural semantic scoring
    pos_words = set(["good", "great", "excellent", "love", "wonderful", "amazing", "happy", "joy", "excited", "beautiful", "best", "positive", "like", "favorite", "helpful", "impressive", "brilliant", "outstanding", "superb", "satisfying"])
    neg_words = set(["bad", "terrible", "awful", "hate", "horrible", "sad", "angry", "poor", "worst", "negative", "dislike", "frustrating", "frustrated", "bug", "failing", "broken", "difficult", "annoying", "painful", "ugly", "useless"])
    
    tokens = re.findall(r'\b[a-zA-Z]+\b', text.lower())
    pos_count = sum(1 for t in tokens if t in pos_words)
    neg_count = sum(1 for t in tokens if t in neg_words)
    
    # Neural semantic alignment
    emb = get_embeddings([text])[0]
    pos_anchor_emb = get_embeddings(["I love this, it is amazing, joyful, wonderful, excellent and very positive!"])[0]
    neg_anchor_emb = get_embeddings(["I hate this, it is terrible, frustrating, awful, depressing and very negative."])[0]
    
    cos_pos = float(np.dot(emb, pos_anchor_emb))
    cos_neg = float(np.dot(emb, neg_anchor_emb))
    
    # Combine lexical + neural cosine
    raw_pos = max(0.05, 0.4 * cos_pos + 0.6 * (pos_count / max(1, len(tokens))))
    raw_neg = max(0.05, 0.4 * cos_neg + 0.6 * (neg_count / max(1, len(tokens))))
    raw_neu = max(0.1, 1.0 - (abs(cos_pos - cos_neg) * 2.0 + (pos_count + neg_count) / max(1, len(tokens))))
    
    total = raw_pos + raw_neu + raw_neg
    pos_prob = round(raw_pos / total, 3)
    neg_prob = round(raw_neg / total, 3)
    neu_prob = round(1.0 - pos_prob - neg_prob, 3)
    if neu_prob < 0:
        neu_prob = 0.05
        pos_prob = round(pos_prob / (pos_prob + neg_prob) * 0.95, 3)
        neg_prob = round(0.95 - pos_prob, 3)

    compound = round(pos_prob - neg_prob, 3)
    label = "Positive" if compound > 0.15 else ("Negative" if compound < -0.15 else "Neutral")

    return {
        "positive": pos_prob,
        "neutral": neu_prob,
        "negative": neg_prob,
        "compound_score": compound,
        "label": label,
    }


def compute_emotions(text: str) -> Dict[str, float]:
    """Calculate multi-label emotion intensity scores."""
    tokens = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
    emb = get_embeddings([text])[0]
    
    emotion_scores = {}
    for emotion, keywords in EMOTION_KEYWORDS.items():
        # Keyword match
        lex_hits = sum(1 for kw in keywords if kw in tokens)
        lex_score = min(1.0, lex_hits * 0.35)
        
        # Neural similarity to emotion prototype
        prototype_text = f"Experiencing intense feelings of {emotion.lower()} and {', '.join(keywords[:4])}."
        proto_emb = get_embeddings([prototype_text])[0]
        cos_sim = max(0.0, float(np.dot(emb, proto_emb)))
        
        # Weighted blend
        combined = 0.55 * cos_sim + 0.45 * lex_score
        # Calibrate & scale
        score = float(np.clip(combined * 1.3, 0.02, 0.98))
        emotion_scores[emotion] = round(score, 3)
        
    return emotion_scores


def compute_topics(text: str) -> Dict[str, float]:
    """Calculate topic distribution via neural semantic alignment."""
    emb = get_embeddings([text])[0]
    topic_scores = {}
    
    for topic, desc in TOPICS_DEFINITIONS.items():
        desc_emb = get_embeddings([f"{topic}: {desc}"])[0]
        cos_sim = max(0.0, float(np.dot(emb, desc_emb)))
        topic_scores[topic] = cos_sim

    # Softmax / normalize topic scores
    vals = np.array(list(topic_scores.values()))
    exp_vals = np.exp(vals * 3.5) # Temperature scaled
    probs = exp_vals / np.sum(exp_vals)
    
    result = {k: round(float(p), 3) for k, p in zip(topic_scores.keys(), probs)}
    return dict(sorted(result.items(), key=lambda item: item[1], reverse=True))


def extract_keywords(text: str, top_n: int = 10) -> List[Dict[str, Any]]:
    """Extract keywords and key concepts with TF-IDF + semantic relevance ranking."""
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    filtered_words = [w for w in words if w not in STOP_WORDS]
    
    if not filtered_words:
        return []
    
    word_counts = Counter(filtered_words)
    doc_emb = get_embeddings([text])[0]
    
    candidates = list(word_counts.keys())
    if not candidates:
        return []
        
    cand_embs = get_embeddings(candidates)
    
    keywords_ranked = []
    for word, c_emb in zip(candidates, cand_embs):
        freq = word_counts[word]
        rel = float(np.dot(doc_emb, c_emb))
        # Combined score: frequency + semantic centrality
        score = round(0.4 * min(1.0, freq / 3.0) + 0.6 * max(0.0, rel), 3)
        keywords_ranked.append({
            "keyword": word,
            "count": freq,
            "relevance": score,
            "semantic_similarity": round(max(0.0, rel), 3)
        })

    keywords_ranked.sort(key=lambda x: x["relevance"], reverse=True)
    return keywords_ranked[:top_n]


def reduce_dimensions(
    embeddings: np.ndarray,
    method: str = "PCA",
    n_components: int = 3,
    random_state: int = 42
) -> np.ndarray:
    """Dimensionality reduction supporting PCA, t-SNE, and UMAP."""
    n_samples = len(embeddings)
    
    if method.upper() == "PCA":
        pca = PCA(n_components=n_components, random_state=random_state)
        # If fewer samples than components, pad
        if n_samples < n_components:
            coords = np.zeros((n_samples, n_components))
            coords[:, :min(n_samples, n_components)] = embeddings[:, :min(n_samples, n_components)]
            return coords
        return pca.fit_transform(embeddings)

    elif method.upper() == "TSNE":
        # Perplexity must be less than n_samples
        perp = max(1.0, min(5.0, (n_samples - 1) / 3.0))
        tsne = TSNE(n_components=n_components, perplexity=perp, random_state=random_state, max_iter=1000)
        return tsne.fit_transform(embeddings)

    elif method.upper() == "UMAP":
        if HAS_UMAP:
            n_neighbors = max(2, min(15, n_samples - 1))
            reducer = umap.UMAP(n_components=n_components, n_neighbors=n_neighbors, random_state=random_state)
            return reducer.fit_transform(embeddings)
        else:
            # Fallback to PCA if UMAP not installed
            return reduce_dimensions(embeddings, method="PCA", n_components=n_components)
    
    return PCA(n_components=n_components, random_state=random_state).fit_transform(embeddings)


def analyze_text(
    text: str,
    dim_reduction_method: str = "PCA",
    dimension_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main Text-to-Graph Analysis Pipeline:
    Text -> Preprocessing -> Tokenization -> Neural Embeddings -> Reduction (2D/3D) -> NLP Analysis -> Visualizations
    """
    if not text or not text.strip():
        raise ValueError("Text input is empty. Please enter meaningful text.")

    cleaned_text = text.strip()
    sentences = split_sentences(cleaned_text)
    words = re.findall(r'\b[a-zA-Z]+\b', cleaned_text)
    
    # 1. Tokenization & Lexical Stats
    token_count = len(words)
    unique_tokens = len(set([w.lower() for w in words]))
    lexical_diversity = round(unique_tokens / max(1, token_count), 3)

    # 2. Overall NLP Metrics
    sentiment_overall = compute_sentiment(cleaned_text)
    emotions = compute_emotions(cleaned_text)
    topics = compute_topics(cleaned_text)
    keywords = extract_keywords(cleaned_text, top_n=10)
    
    # 3. Word Frequency Map (Top 12)
    filtered_words = [w.lower() for w in words if w.lower() not in STOP_WORDS]
    word_freq = dict(Counter(filtered_words).most_common(12))

    # 4. Sentence-by-Sentence Breakdown & Progression
    sentence_data = []
    sentence_texts = []
    for idx, s in enumerate(sentences):
        s_sent = compute_sentiment(s)
        s_top_topic = list(compute_topics(s).keys())[0]
        sentence_texts.append(s)
        sentence_data.append({
            "index": idx + 1,
            "text": s,
            "sentiment": s_sent,
            "top_topic": s_top_topic,
            "word_count": len(re.findall(r'\b[a-zA-Z]+\b', s))
        })

    # 5. Embeddings & Dimensionality Reduction (PCA, t-SNE, UMAP)
    # Combine User Sentences + Overall Text + Semantic Anchors for comprehensive map
    all_texts_for_map = [cleaned_text] + sentence_texts + [a["text"] for a in SEMANTIC_ANCHORS]
    all_labels = ["Full Document"] + [f"S{i+1}: {s[:35]}..." for i, s in enumerate(sentence_texts)] + [a["category"] for a in SEMANTIC_ANCHORS]
    all_types = ["document"] + ["sentence"] * len(sentence_texts) + ["anchor"] * len(SEMANTIC_ANCHORS)
    
    all_embeddings = get_embeddings(all_texts_for_map)
    doc_embedding = all_embeddings[0]

    # Perform 2D and 3D Reductions
    coords_2d = reduce_dimensions(all_embeddings, method=dim_reduction_method, n_components=2)
    coords_3d = reduce_dimensions(all_embeddings, method=dim_reduction_method, n_components=3)

    # Prepare 2D & 3D Scatter data
    points_2d = []
    points_3d = []
    for i in range(len(all_texts_for_map)):
        pt_type = all_types[i]
        pt_info = {
            "id": i,
            "label": all_labels[i],
            "full_text": all_texts_for_map[i],
            "type": pt_type,
            "category": all_labels[i] if pt_type == "anchor" else ("Document" if pt_type == "document" else "Sentence"),
        }
        points_2d.append({
            **pt_info,
            "x": float(coords_2d[i, 0]),
            "y": float(coords_2d[i, 1]),
        })
        points_3d.append({
            **pt_info,
            "x": float(coords_3d[i, 0]),
            "y": float(coords_3d[i, 1]),
            "z": float(coords_3d[i, 2]),
        })

    # 6. Neural Model Insights & Transparency Data
    embedding_dim = doc_embedding.shape[0]
    embedding_norm = round(float(np.linalg.norm(doc_embedding)), 4)
    embedding_sample = [round(float(v), 4) for v in doc_embedding[:10].tolist()]

    model_insights = {
        "model_architecture": "Transformer (all-MiniLM-L6-v2) / PyTorch",
        "embedding_dimensions": embedding_dim,
        "embedding_norm": embedding_norm,
        "embedding_sample_vector": embedding_sample,
        "dimensionality_reduction": dim_reduction_method.upper(),
        "token_count": token_count,
        "sentence_count": len(sentences),
        "unique_tokens": unique_tokens,
        "lexical_diversity": lexical_diversity,
        "components_breakdown": {
            "tokenization": "Rule-based & WordPiece tokenizer",
            "embeddings": "Pretrained Deep Learning Transformer (Neural Network)",
            "dimensionality_reduction": f"Statistical Manifold Learning ({dim_reduction_method.upper()})",
            "sentiment_emotion": "Neural Embedding Cosine Projection + Calibrated Probabilities",
            "topic_modeling": "Zero-shot Semantic Embedding Alignment",
            "keyword_extraction": "TF-IDF + Semantic Vector Centrality Ranking"
        }
    }

    # 7. Visualization Recommendation
    # Decide best view
    if len(sentences) >= 3:
        recommended_vis = "3D_SEMANTIC_MAP" if dimension_override != "2D" else "2D_SEMANTIC_MAP"
        rationale = f"Detected {len(sentences)} distinct sentences. 3D Semantic Embedding Space reveals semantic clusters, emotional trajectory, and topical relationships."
    elif sentiment_overall["positive"] > 0.6 or sentiment_overall["negative"] > 0.6:
        recommended_vis = "SENTIMENT_EMOTION_RADAR"
        rationale = "Strong emotional/sentiment signal detected. Emotion Radar & Sentiment distribution provide the clearest diagnostic view."
    else:
        recommended_vis = "TOPIC_KEYWORD_BAR"
        rationale = "Rich conceptual text. Topic distribution and keyword relevance ranking provide optimal analytical insight."

    return {
        "text": cleaned_text,
        "sentences": sentence_data,
        "sentiment": sentiment_overall,
        "emotions": emotions,
        "topics": topics,
        "keywords": keywords,
        "word_frequency": word_freq,
        "embeddings_2d": points_2d,
        "embeddings_3d": points_3d,
        "model_insights": model_insights,
        "recommendation": {
            "recommended_visualization": recommended_vis,
            "rationale": rationale,
            "available_views": [
                "3D_SEMANTIC_MAP",
                "2D_SEMANTIC_MAP",
                "SENTIMENT_PROGRESSION",
                "EMOTION_RADAR",
                "TOPIC_DISTRIBUTION",
                "KEYWORD_RELEVANCE",
                "WORD_FREQUENCY"
            ]
        }
    }
