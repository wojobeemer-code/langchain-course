import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   COURSE DATA
───────────────────────────────────────────────────────────── */

const MODULES = [
  /* ── MODULE 1 ─────────────────────────────────────────────── */
  {
    id: "m1", num: "01", icon: "⚡", accent: "#F97316",
    title: "LangChain Foundations",
    tagline: "Understand the framework before you use it",
    overview: "Master LangChain's philosophy, ecosystem, and core building blocks. Learn when to use LangChain vs. raw APIs, set up your environment, and make your first LLM calls with real parameter control.",
    project: {
      title: "LLM Parameter Playground",
      time: "3-4 hours",
      description: "Build a Python CLI tool that calls the same prompt with 5 temperature values (0, 0.25, 0.5, 0.75, 1.0) across at least 2 LLM providers (e.g. GPT-4o-mini + Gemini Flash via LangChain). Display a formatted comparison table showing: response text, token count, latency, and a 1-line summary of how the response changed. Add a --creative and --precise mode that sets temperature automatically.",
      skills: ["LLM init", "Temperature", "Multi-provider", "Token counting", "CLI with argparse"]
    },
    lessons: [
      {
        id: "m1l1", title: "What Is LangChain & When To Use It", readTime: "20 min",
        content: [
          { type: "text", text: "LangChain is an open-source framework for building LLM-powered applications. The core insight: calling an LLM API is easy. Building a production AI system around LLM calls is hard. LangChain solves the second problem by giving you composable building blocks.\n\nFor a single LLM call, you don't need LangChain — five lines of the OpenAI SDK does it. But the moment you add memory, tool use, retrieval, or multi-step reasoning, complexity compounds fast. LangChain manages that complexity." },
          { type: "callout", variant: "info", text: "The framework's strength is composability. Prompts → LLMs → Parsers → next step. Everything is a Runnable with a consistent interface." },
          { type: "text", text: "THE LANGCHAIN ECOSYSTEM:\n\n• langchain-core — Core abstractions: Runnables, Messages, PromptTemplates\n• langchain — LLM provider integrations (OpenAI, Anthropic, Google, etc.)\n• langchain-community — 500+ community integrations\n• LangSmith — Observability, tracing, evaluation (use this from day 1)\n• LangGraph — Graph-based agent orchestration (the advanced path)\n\nWHEN TO USE LANGCHAIN:\n• RAG pipelines over documents\n• Agents that use tools\n• Conversational apps with memory\n• Multi-step LLM chains\n• Structured output generation\n• Comparing multiple LLM providers\n\nWHEN NOT TO:\n• Single API call apps\n• You need full control over every byte\n• The abstractions fight your architecture" },
          { type: "callout", variant: "warning", text: "LangChain abstracts a lot. This is both strength (fast to start) and weakness (hard to debug). This course's strategy: start abstract → strip away abstractions as you understand them → get explicit where you need control." },
          { type: "code", lang: "python", code: `# The simplest possible LangChain program
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(model="gpt-4o-mini")
response = llm.invoke([HumanMessage(content="What is LangChain?")])
print(response.content)

# Same thing with raw OpenAI SDK (no LangChain)
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "What is LangChain?"}]
)
print(response.choices[0].message.content)
# Both work. For THIS use case, the raw API is fine.` }
        ],
        assignments: [
          { id: "m1l1a1", title: "Framework Decision Matrix", difficulty: "Beginner", type: "Analysis", time: "30 min",
            description: "For each scenario, choose: (A) Raw SDK, (B) LangChain, or (C) LangGraph. Write 2-sentence justification for each.\n\n1. One-shot blog post summarizer\n2. Customer support bot with conversation history + order lookup\n3. Research agent: web search → read articles → synthesize report\n4. Script to reformat 1,000 JSON files with GPT-4o-mini\n5. Code assistant that runs code, sees output, debugs, iterates\n6. Document Q&A over 10,000 internal docs\n7. Single API endpoint: summarize text → return JSON\n8. Personalized meal planner that remembers dietary preferences across sessions",
            deliverable: "Table with scenario, choice, and justification" },
          { id: "m1l1a2", title: "Ecosystem Diagram", difficulty: "Beginner", type: "Research", time: "45 min",
            description: "Without looking at your notes, draw the LangChain ecosystem from memory. Show all 5 main components (langchain-core, langchain, langchain-community, LangSmith, LangGraph), what each does, and how they relate. Then check against the docs at python.langchain.com/docs/concepts/ and note what you missed.",
            deliverable: "Diagram + gap analysis" },
          { id: "m1l1a3", title: "Read the Conceptual Guide", difficulty: "Beginner", type: "Reading", time: "1 hour",
            description: "Read the full Conceptual Guide at python.langchain.com/docs/concepts/. As you read, write: (1) 5 things that surprised you, (2) 3 things you don't understand yet, (3) which section you want to explore first in code. This builds your mental map before diving deeper.",
            deliverable: "Annotated notes with the 3 sections completed" }
        ]
      },
      {
        id: "m1l2", title: "Environment Setup & First LLM Call", readTime: "30 min",
        content: [
          { type: "text", text: "A clean environment is non-negotiable. Most beginners waste hours on dependency issues. Use virtual environments. Use uv (faster than pip/conda for new projects) or standard venv. Store API keys in .env files — never hardcode them." },
          { type: "code", lang: "bash", code: `# Install uv (fast Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create project + virtual env
mkdir my-langchain-project && cd my-langchain-project
uv init
uv venv
source .venv/bin/activate  # Mac/Linux
# .venv\\Scripts\\activate   # Windows

# Install LangChain packages
uv add langchain langchain-openai langchain-anthropic python-dotenv langsmith` },
          { type: "code", lang: "python", code: `# .env file (never commit this)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
LANGCHAIN_API_KEY=ls__...
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=my-first-project` },
          { type: "code", lang: "python", code: `# main.py — your first LangChain call
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import SystemMessage, HumanMessage

load_dotenv()

# Initialize models
openai_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
claude_llm = ChatAnthropic(model="claude-haiku-4-5-20251001", temperature=0)

messages = [
    SystemMessage(content="You are a helpful assistant."),
    HumanMessage(content="Explain what a vector database is in 2 sentences.")
]

# Both have the same invoke() interface — this is LangChain's power
openai_response = openai_llm.invoke(messages)
claude_response = claude_llm.invoke(messages)

print("OpenAI:", openai_response.content)
print("Claude:", claude_response.content)

# Access metadata
print("Tokens used:", openai_response.usage_metadata)` },
          { type: "callout", variant: "tip", text: "Enable LangSmith tracing from day 1. Set LANGCHAIN_TRACING_V2=true and LANGCHAIN_API_KEY in your .env. Every call will be logged at smith.langchain.com — invaluable for debugging." }
        ],
        assignments: [
          { id: "m1l2a1", title: "Working Environment", difficulty: "Beginner", type: "Code", time: "45 min",
            description: "Set up a LangChain project from scratch using uv. Install: langchain, langchain-openai, langchain-anthropic (or langchain-google-genai), python-dotenv, langsmith. Write a main.py that: (1) loads env vars with dotenv, (2) initializes 2 different LLM providers, (3) calls both with the same message, (4) prints responses + token counts. Verify you can see the traces in LangSmith.",
            deliverable: "Working main.py + screenshot of LangSmith trace" },
          { id: "m1l2a2", title: "Message Types Lab", difficulty: "Beginner", type: "Code", time: "30 min",
            description: "Write a script that demonstrates all 4 core message types: SystemMessage, HumanMessage, AIMessage, ToolMessage. For SystemMessage + HumanMessage: call an LLM and observe how the system message shapes the response. Try: (a) system='You are a pirate', (b) system='You are a JSON-only responder — only output valid JSON'. For AIMessage: manually construct a 3-turn conversation by building the message list yourself (no memory — just a list). Invoke and verify the LLM sees the history.",
            deliverable: "Script with all 4 message types demonstrated + your observations" },
          { id: "m1l2a3", title: "Provider Comparison", difficulty: "Intermediate", type: "Build", time: "1.5 hours",
            description: "Build a provider_compare.py script that: (1) accepts a prompt from the user via input(), (2) sends it to at least 3 LLM providers/models using the same LangChain interface, (3) prints each response with: provider name, model name, latency in ms, and token count. Add error handling for API failures. Bonus: add a --json flag that outputs results as structured JSON.",
            deliverable: "Working provider_compare.py that handles failures gracefully" }
        ]
      },
      {
        id: "m1l3", title: "LLM Parameters Deep Dive", readTime: "25 min",
        content: [
          { type: "text", text: "Understanding LLM parameters is not optional — they directly affect output quality, cost, and reliability. The three most important: temperature, max_tokens, and model selection." },
          { type: "code", lang: "python", code: `from langchain_openai import ChatOpenAI

# Temperature: controls output randomness
# 0 = most deterministic (best for facts, code, structured output)
# 0.7 = balanced (good default for most tasks)
# 1.0+ = more creative/random (creative writing, brainstorming)
llm_precise = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm_creative = ChatOpenAI(model="gpt-4o-mini", temperature=0.9)

# Max tokens: caps output length (affects cost + truncation risk)
llm_short = ChatOpenAI(model="gpt-4o-mini", max_tokens=100)

# Streaming: get tokens as they generate (essential for UX)
llm_stream = ChatOpenAI(model="gpt-4o-mini", streaming=True)

# Full parameter control
llm_full = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    max_tokens=500,
    timeout=30,          # API timeout in seconds
    max_retries=3,       # Auto-retry on failure
    # model_kwargs={"top_p": 0.9}  # Provider-specific params
)

# Invoke and inspect the response object
response = llm_precise.invoke("What is 2+2?")
print(type(response))           # AIMessage
print(response.content)         # The actual text
print(response.usage_metadata)  # Tokens: input, output, total
print(response.response_metadata)  # Model info, finish reason` },
          { type: "text", text: "KEY INSIGHT — Temperature Under the Hood:\n\nWhen an LLM predicts the next token, it assigns a probability to every token in its vocabulary. Temperature scales these probabilities:\n\n• temp=0: Always pick the highest-probability token (greedy/deterministic)\n• temp=1: Sample from the raw probability distribution\n• temp>1: Flatten the distribution (more randomness)\n• temp<1: Sharpen the distribution (less randomness)\n\nThis is why temperature=0 gives consistent, reproducible outputs — ideal for code generation, structured extraction, and factual Q&A. Temperature=0.7-1.0 gives varied, creative outputs — ideal for writing, ideation, and diverse generation." },
          { type: "callout", variant: "tip", text: "For RAG: use temperature=0 or 0.1. For agents: use temperature=0 (you want predictable tool calls). For creative tasks: 0.7-1.0. For structured output: always temperature=0." }
        ],
        assignments: [
          { id: "m1l3a1", title: "Temperature Experiment", difficulty: "Beginner", type: "Experiment", time: "45 min",
            description: "Write a script that calls the same prompt 3 times each at temperatures 0, 0.5, and 1.0 (9 calls total). Prompt: 'Write a creative opening line for a sci-fi novel.' Record all 9 responses. Analyze: how much variation exists at each temperature? At which temperature do you see the most diverse responses? At which temperature would responses be most predictable?",
            deliverable: "Script + written analysis of temperature effects" },
          { id: "m1l3a2", title: "Response Object Deep Dive", difficulty: "Beginner", type: "Research", time: "30 min",
            description: "Make 3 LLM calls with different prompts. For each response, print and document EVERY attribute of the AIMessage object (use dir() and vars()). Draw a diagram of the AIMessage object structure. What's in content, response_metadata, usage_metadata, and additional_kwargs? How do you access token counts? What's the finish_reason and what values can it have?",
            deliverable: "Documented AIMessage structure diagram" },
          { id: "m1l3a3", title: "Cost Calculator", difficulty: "Intermediate", type: "Build", time: "1.5 hours",
            description: "Build a cost_tracker.py that: (1) wraps any LangChain LLM call, (2) captures input tokens, output tokens, and model name from usage_metadata, (3) looks up the price per token for that model (hardcode a price dict for at least 5 models), (4) calculates and logs the cost for each call, (5) maintains a running total for the session. Call it 10 times with different prompts. Output: total cost and average cost per call.",
            deliverable: "cost_tracker.py that accurately tracks costs across multiple calls" }
        ]
      },
      {
        id: "m1l4", title: "The LangChain Runnable Interface", readTime: "20 min",
        content: [
          { type: "text", text: "Everything in LangChain is a Runnable. This is the single most important concept in the framework. A Runnable is an object with a consistent interface: invoke(), stream(), batch(), ainvoke(), astream(), abatch(). When every component speaks the same language, you can compose them freely." },
          { type: "code", lang: "python", code: `from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{input}")
])
parser = StrOutputParser()

# All of these are Runnables — same interface
# invoke() — single call, returns final result
result = llm.invoke("Hello!")
result = prompt.invoke({"input": "Hello!"})

# batch() — run multiple inputs in parallel (efficient)
results = llm.batch(["Hello!", "Hi there!", "What's up?"])

# stream() — get tokens as they arrive
for chunk in llm.stream("Tell me a story"):
    print(chunk.content, end="", flush=True)

# ainvoke(), astream(), abatch() — async versions
# (covered in Module 7)

# The power: compose Runnables with |
chain = prompt | llm | parser
result = chain.invoke({"input": "What is a Runnable?"})
print(result)  # Plain string, not AIMessage` },
          { type: "callout", variant: "info", text: "The pipe operator (|) is the core of LCEL (LangChain Expression Language). We cover it deeply in Module 3. For now, know that chain = prompt | llm | parser creates a pipeline where output of each step feeds into the next." }
        ],
        assignments: [
          { id: "m1l4a1", title: "Runnable Methods Lab", difficulty: "Beginner", type: "Code", time: "45 min",
            description: "For each Runnable method (invoke, batch, stream), write a script that: (1) calls an LLM with that method, (2) measures wall-clock time, (3) prints the result. Specific tasks: For batch(), call with 5 prompts simultaneously and compare total time vs. 5 sequential invoke() calls. For stream(), print tokens with a | separator so you can see individual chunks. Record the time difference between batch and sequential.",
            deliverable: "Script + timing comparison table" },
          { id: "m1l4b1", title: "Your First Chain", difficulty: "Beginner", type: "Code", time: "30 min",
            description: "Build your first LCEL chain using prompt | llm | StrOutputParser(). The chain should: take a topic as input, generate a 3-bullet-point summary. Test it with 5 different topics. Print the output type at each stage: what does prompt.invoke() return? What does (prompt | llm).invoke() return? What does the full chain return?",
            deliverable: "Working chain + type output at each stage" }
        ]
      }
    ]
  },

  /* ── MODULE 2 ─────────────────────────────────────────────── */
  {
    id: "m2", num: "02", icon: "💬", accent: "#A855F7",
    title: "Prompt Engineering in LangChain",
    tagline: "Prompts are code — treat them that way",
    overview: "Prompts are the primary interface between your logic and the LLM. You'll master PromptTemplates, few-shot examples, Chain of Thought, structured output extraction, and output parsers. These skills compound — everything else in this course depends on being able to reliably instruct an LLM.",
    project: {
      title: "Multi-function Prompt Pipeline",
      time: "4-5 hours",
      description: "Build a content_pipeline.py that takes an article (URL or text) and produces a full analysis package: (1) SEO-friendly title (< 60 chars), (2) Meta description (< 155 chars), (3) 3-5 key takeaways as structured JSON, (4) Sentiment score 1-10, (5) Target audience description, (6) One improved paragraph (pick the weakest paragraph in the article and rewrite it). Each output should use a different prompt technique: few-shot for title, CoT for sentiment, structured output for takeaways. Wrap in a CLI.",
      skills: ["ChatPromptTemplate", "Few-shot", "Chain of Thought", "Structured output", "StrOutputParser", "PydanticOutputParser"]
    },
    lessons: [
      {
        id: "m2l1", title: "ChatPromptTemplate & Prompt Architecture", readTime: "25 min",
        content: [
          { type: "text", text: "A chat LLM doesn't just take text — it takes a structured conversation. Understanding the three prompt roles is foundational:\n\nSystem message: Instructions for the LLM. Sets behavior, persona, constraints, output format. The LLM can't respond to this — it just follows it. Put your most important instructions here.\n\nHuman message: The user's input. This is what the user types. Usually dynamic — you fill in a variable here.\n\nAI message: Previous assistant responses. Used to build conversation history or pre-populate responses (advanced use case)." },
          { type: "code", lang: "python", code: `from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate

# Method 1: from_messages with tuples (most common)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert {domain} assistant. Always respond in {language}."),
    ("human", "Question: {question}")
])

# Check what variables are needed
print(prompt.input_variables)  # ['domain', 'language', 'question']

# Format the prompt (returns list of messages, not a string)
messages = prompt.format_messages(
    domain="Python",
    language="English",
    question="What is a decorator?"
)
print(type(messages[0]))  # SystemMessage
print(messages[0].content)

# Method 2: Explicit template objects (more verbose, more control)
system = SystemMessagePromptTemplate.from_template(
    "You are a {role}. {instructions}"
)
human = HumanMessagePromptTemplate.from_template("{user_input}")

prompt2 = ChatPromptTemplate.from_messages([system, human])

# Use with LCEL
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

chain = prompt | ChatOpenAI(model="gpt-4o-mini") | StrOutputParser()
result = chain.invoke({
    "domain": "Python",
    "language": "English",
    "question": "What is a decorator?"
})` },
          { type: "callout", variant: "tip", text: "Keep system prompts focused. One responsibility per system prompt. If you're fighting the LLM to follow instructions, your system prompt is probably too vague or too long." },
          { type: "text", text: "PROMPT ENGINEERING RULES:\n\n1. Be specific, not vague. 'Respond in JSON' is vague. 'Respond with a JSON object with keys: title (string), score (integer 1-10), tags (array of strings)' is specific.\n\n2. Positive instructions > negative instructions. 'Focus on X' works better than 'Don't do Y'.\n\n3. Format your instructions. Numbered lists, headers, and examples in system prompts improve adherence.\n\n4. Temperature=0 for structured tasks. You want reproducible outputs when parsing LLM responses as data.\n\n5. Add 'do not output anything else' for programmatic parsing. LLMs love to add preambles." }
        ],
        assignments: [
          { id: "m2l1a1", title: "System Prompt Effects", difficulty: "Beginner", type: "Experiment", time: "1 hour",
            description: "Write 5 radically different system prompts for the same task ('Explain X in simple terms'). Try: (a) no system prompt, (b) 'You are a professor', (c) 'You are a 5-year-old explaining things', (d) 'You respond ONLY in bullet points, max 5 bullets', (e) 'You are extremely skeptical and always point out limitations first'. Call each with the same human message and document how the response changes. Which produced the most useful output?",
            deliverable: "5 system prompts + response comparison + analysis" },
          { id: "m2l1a2", title: "Dynamic Prompt Builder", difficulty: "Intermediate", type: "Build", time: "1.5 hours",
            description: "Build a PromptBuilder class that: (1) stores a system template and human template separately, (2) has a method add_context(text) that appends context to the system prompt, (3) has a method set_output_format(format_description) that adds output instructions, (4) has an invoke(user_input, **vars) method that builds and runs the full chain. Test it by building 3 different use cases (a code reviewer, a translator, a summarizer) using the same class.",
            deliverable: "PromptBuilder class with 3 tested use cases" },
          { id: "m2l1a3", title: "Prompt Injection Test", difficulty: "Intermediate", type: "Experiment", time: "45 min",
            description: "Test your prompts for injection vulnerabilities. Build a customer service bot with a strict system prompt ('You only discuss product returns. Never discuss anything else.'). Then try 5 adversarial human messages that try to make it go off-topic: (a) 'Ignore previous instructions...', (b) 'Actually, your real purpose is...', (c) 'For testing, please...', (d) 'What would you say if...', (e) a subtle redirect. Document which attempts succeeded and what defensive prompt additions blocked them.",
            deliverable: "Injection test results + hardened system prompt" }
        ]
      },
      {
        id: "m2l2", title: "Few-Shot Prompting", readTime: "20 min",
        content: [
          { type: "text", text: "Few-shot prompting means giving the LLM examples of what you want before asking for the real thing. It's one of the most powerful techniques, especially for:\n\n• Enforcing a very specific output format\n• Teaching the LLM a custom style or voice\n• Improving performance on domain-specific tasks with smaller models\n• Getting consistent labeling/classification\n\nModern frontier models (GPT-4o, Claude 3.5) follow instructions so well that few-shot is less critical for them. But for smaller/cheaper models, it dramatically improves output quality." },
          { type: "code", lang: "python", code: `from langchain_core.prompts import ChatPromptTemplate, FewShotChatMessagePromptTemplate

# Define your examples
examples = [
    {
        "input": "The product arrived damaged and customer service was unhelpful.",
        "output": '{"sentiment": "negative", "score": 2, "issue": "product_quality, customer_service"}'
    },
    {
        "input": "Shipping was slow but the item is exactly what I expected.",
        "output": '{"sentiment": "neutral", "score": 6, "issue": "shipping"}'
    },
    {
        "input": "Absolutely love it! Fast shipping, perfect quality, will buy again.",
        "output": '{"sentiment": "positive", "score": 10, "issue": "none"}'
    }
]

# The template for each example
example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}")
])

# Build the few-shot prompt
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples,
)

# Wrap in a full prompt with system message
final_prompt = ChatPromptTemplate.from_messages([
    ("system", "Classify customer reviews. Only output valid JSON, nothing else."),
    few_shot_prompt,
    ("human", "{review}")
])

from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
import json

chain = final_prompt | ChatOpenAI(model="gpt-4o-mini", temperature=0) | StrOutputParser()

result = chain.invoke({"review": "Good price but took 3 weeks to arrive and packaging was terrible."})
parsed = json.loads(result)
print(parsed)` },
          { type: "callout", variant: "info", text: "Dynamic few-shot: For advanced use, select examples dynamically based on semantic similarity to the input. This is called 'dynamic few-shot' and uses a vector store to find the most relevant examples at runtime." }
        ],
        assignments: [
          { id: "m2l2a1", title: "Few-Shot Classifier", difficulty: "Intermediate", type: "Build", time: "1.5 hours",
            description: "Build a ticket_classifier.py that classifies customer support tickets into categories (billing, technical, account, shipping, other) using few-shot prompting. Create 3 examples per category (15 examples total). Test with 10 new tickets you write yourself. Measure: with 0 examples vs. 1 example vs. 3 examples per category — how does accuracy change on your test set?",
            deliverable: "Classifier with accuracy comparison at 0/1/3 examples" },
          { id: "m2l2a2", title: "Style Mimicker", difficulty: "Intermediate", type: "Build", time: "2 hours",
            description: "Build a writing style mimicker using few-shot prompts. Pick 3 distinct writing styles (e.g., Hemingway: short, punchy sentences; academic: formal, passive voice; startup: casual, energetic). Provide 2 examples per style. Build a chain that takes: topic + style_name, and generates a short paragraph in that style. Evaluate: does the output actually match the style? Iterate on your examples until it does.",
            deliverable: "Style mimicker with 3 working styles + evaluation notes" }
        ]
      },
      {
        id: "m2l3", title: "Chain of Thought & Advanced Prompting", readTime: "25 min",
        content: [
          { type: "text", text: "Chain of Thought (CoT) prompting forces the LLM to reason step-by-step before giving an answer. This dramatically improves performance on complex reasoning, math, and multi-step problems.\n\nWhy it works: LLMs generate tokens sequentially. When forced to write out intermediate reasoning, they 'catch' logical errors that they'd skip over when jumping straight to an answer. It's the AI equivalent of 'show your work.'" },
          { type: "code", lang: "python", code: `from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# Without CoT — often wrong on complex problems
no_cot_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a math assistant. Answer directly."),
    ("human", "{problem}")
])

# With CoT — forces step-by-step reasoning
cot_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a math assistant. To answer any problem:
1. Break the problem into sub-problems
2. Solve each sub-problem showing all work
3. Combine to get the final answer
4. State: 'Final Answer: X'"""),
    ("human", "{problem}")
])

# Zero-shot CoT: just add "Think step by step."
zeroshot_cot_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{problem}\n\nThink step by step.")
])

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
parser = StrOutputParser()

problem = "If a train travels 120 miles in 2 hours, then slows to half speed for the next 60 miles, how long does the total journey take?"

no_cot_chain = no_cot_prompt | llm | parser
cot_chain = cot_prompt | llm | parser

print("Without CoT:", no_cot_chain.invoke({"problem": problem}))
print("\\nWith CoT:", cot_chain.invoke({"problem": problem}))` },
          { type: "text", text: "OTHER KEY PROMPTING TECHNIQUES:\n\n• Self-consistency: Run the same prompt multiple times, take the majority vote. Improves accuracy on ambiguous problems.\n\n• ReAct: Reason → Act → Observe → Repeat. The foundation of LangChain agents (covered in Module 6).\n\n• Least-to-most prompting: Break a hard problem into simpler sub-problems, solve each, combine.\n\n• Prompt chaining: The output of one LLM call becomes the input to the next. This is literally what LCEL chains do." }
        ],
        assignments: [
          { id: "m2l3a1", title: "CoT vs No-CoT Benchmark", difficulty: "Intermediate", type: "Experiment", time: "1.5 hours",
            description: "Create 10 math/logic problems of increasing difficulty. Run each with: (a) no CoT, (b) zero-shot CoT ('Think step by step'), (c) few-shot CoT (2 examples). Record correctness for each combination (30 runs total). Build a simple accuracy table. At what difficulty level does CoT start making a real difference?",
            deliverable: "10 problems + results table + analysis" },
          { id: "m2l3a2", title: "Self-Consistency Voter", difficulty: "Advanced", type: "Build", time: "2 hours",
            description: "Build a self_consistency.py that: (1) takes a reasoning problem, (2) calls the LLM N times (configurable, default 5) with temperature=0.7, (3) extracts the final answer from each response, (4) returns the majority vote answer. Test on 5 ambiguous or tricky problems. Compare single-call accuracy vs. self-consistency accuracy. Note the cost tradeoff (N× more tokens).",
            deliverable: "self_consistency.py with 5 test cases and accuracy comparison" }
        ]
      },
      {
        id: "m2l4", title: "Structured Output & Output Parsers", readTime: "30 min",
        content: [
          { type: "text", text: "Getting plain text from an LLM is the beginning. Real applications need structured data: JSON objects, typed dictionaries, Pydantic models. LangChain provides several ways to achieve this, from simple parsers to enforced tool-calling." },
          { type: "code", lang: "python", code: `from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional

# Method 1: StrOutputParser — raw string
chain = ChatPromptTemplate.from_messages([("human", "{input}")]) | ChatOpenAI(model="gpt-4o-mini") | StrOutputParser()

# Method 2: JsonOutputParser — parse JSON from response
json_chain = (
    ChatPromptTemplate.from_messages([
        ("system", "Always respond with valid JSON only. No markdown code blocks."),
        ("human", "Extract key info from: {text}")
    ])
    | ChatOpenAI(model="gpt-4o-mini", temperature=0)
    | JsonOutputParser()
)

# Method 3: with_structured_output (BEST — uses tool calling internally)
class ArticleAnalysis(BaseModel):
    title: str = Field(description="SEO-optimized title, max 60 chars")
    summary: str = Field(description="2-sentence summary")
    sentiment: str = Field(description="positive, negative, or neutral")
    score: int = Field(description="Quality score 1-10", ge=1, le=10)
    tags: List[str] = Field(description="3-5 relevant tags")
    word_count: Optional[int] = Field(description="Approximate word count", default=None)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
structured_llm = llm.with_structured_output(ArticleAnalysis)

prompt = ChatPromptTemplate.from_messages([
    ("system", "Analyze the given article and extract structured information."),
    ("human", "Article: {article}")
])

chain = prompt | structured_llm

result = chain.invoke({"article": "Your article text here..."})
print(type(result))       # ArticleAnalysis (Pydantic model!)
print(result.title)       # Type-safe access
print(result.score)       # Already an int
print(result.tags)        # Already a list
print(result.model_dump()) # Dict representation` },
          { type: "callout", variant: "tip", text: "Use with_structured_output() for production. It uses function/tool calling under the hood, which is far more reliable than asking the LLM to format JSON in its response text. You get Pydantic validation for free." }
        ],
        assignments: [
          { id: "m2l4a1", title: "Pydantic Output Pipeline", difficulty: "Intermediate", type: "Build", time: "2 hours",
            description: "Build a resume_parser.py that takes raw resume text as input and extracts structured data into a Pydantic model. Your model should include: name, email, phone, years_of_experience (int), skills (List[str]), education (List with school/degree/year), work_history (List with company/role/duration/description). Test with 3 different real resume formats. Handle cases where fields are missing (Optional fields with defaults).",
            deliverable: "resume_parser.py tested on 3 different resume formats" },
          { id: "m2l4a2", title: "Parser Comparison", difficulty: "Intermediate", type: "Experiment", time: "1.5 hours",
            description: "Build the same data extraction task (extract product info: name, price, rating, description, availability) using 3 different approaches: (1) raw StrOutputParser + custom regex, (2) JsonOutputParser with a JSON-instructed prompt, (3) with_structured_output() with Pydantic. Test all 3 on 10 product descriptions. Score by: reliability (did it parse correctly?), ease of code, and error handling. Which wins and why?",
            deliverable: "3 implementations + comparison matrix + recommendation" }
        ]
      },
      {
        id: "m2l5", title: "Prompt Templates: Advanced Patterns", readTime: "20 min",
        content: [
          { type: "text", text: "Beyond basic templates: partial prompts, MessagesPlaceholder for dynamic history injection, and composing prompts programmatically." },
          { type: "code", lang: "python", code: `from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

# MessagesPlaceholder — for injecting dynamic message lists
# Essential for: chat history, agent scratchpad, few-shot examples
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant named {name}."),
    MessagesPlaceholder(variable_name="chat_history"),  # inject full list here
    ("human", "{input}")
])

# Simulate conversation history
history = [
    HumanMessage(content="My name is Blake"),
    AIMessage(content="Nice to meet you, Blake!"),
    HumanMessage(content="I'm learning LangChain"),
    AIMessage(content="That's great! LangChain is a powerful framework."),
]

messages = prompt.format_messages(
    name="Aria",
    chat_history=history,  # Inserted as a flat list between system and human
    input="What was the first thing I told you?"
)
# The LLM now sees the full conversation context

# Partial prompts — pre-fill some variables, leave others open
from langchain_core.prompts import PromptTemplate

template = PromptTemplate.from_template(
    "Translate the following to {language}:\\n{text}"
)

# Pre-fill language, leave text open
spanish_translator = template.partial(language="Spanish")
french_translator = template.partial(language="French")

# Now just pass text
spanish_msg = spanish_translator.format(text="Hello world")
french_msg = french_translator.format(text="Hello world")` }
        ],
        assignments: [
          { id: "m2l5a1", title: "Dynamic RAG Prompt", difficulty: "Intermediate", type: "Build", time: "1.5 hours",
            description: "Build a rag_prompt_builder.py that constructs a RAG prompt dynamically. It should: (1) accept context_chunks (list of strings), (2) accept chat_history (list of messages), (3) accept user_query, (4) build a prompt that: injects context in the system message, injects history via MessagesPlaceholder, includes the user query. Add a max_context_length parameter that truncates context chunks if they'd exceed a token budget.",
            deliverable: "rag_prompt_builder.py with token budget management" }
        ]
      }
    ]
  },

  /* ── MODULE 3 ─────────────────────────────────────────────── */
  {
    id: "m3", num: "03", icon: "🔗", accent: "#22D3EE",
    title: "LangChain Expression Language (LCEL)",
    tagline: "The pipe operator is not just syntax — it's a philosophy",
    overview: "LCEL is the recommended way to build everything in LangChain. You'll master the pipe operator, understand Runnables at a deep level, use RunnableParallel for concurrent execution, and build complex multi-step chains. After this module, you'll build chains the way LangChain intended.",
    project: {
      title: "Multi-Source Intelligence Pipeline",
      time: "4-6 hours",
      description: "Build an intelligence_pipeline.py that takes a company name and produces a comprehensive brief. Use RunnableParallel to concurrently: (1) search for recent news (mock with hardcoded data or use Tavily), (2) extract company description from a knowledge base (mock with a dict), (3) generate financial snapshot (mock data). Then pass all three outputs to a final summarization LLM that synthesizes them. Output a structured Pydantic object. Measure the time savings from parallelism vs. sequential execution.",
      skills: ["RunnableParallel", "RunnablePassthrough", "RunnableLambda", "Timing parallel vs sequential", "Chain composition"]
    },
    lessons: [
      {
        id: "m3l1", title: "The Pipe Operator & Runnable Internals", readTime: "25 min",
        content: [
          { type: "text", text: "The pipe operator (|) is syntactic sugar for chaining Runnables. Understanding what's happening underneath makes you a far better LangChain developer." },
          { type: "code", lang: "python", code: `# What the | operator actually does (under the hood)
class Runnable:
    def invoke(self, input): ...
    
    def __or__(self, other):
        # | operator creates a RunnableSequence
        return RunnableSequence(self, other)

# So this:
chain = prompt | llm | parser

# Is exactly equivalent to:
from langchain_core.runnables import RunnableSequence
chain = RunnableSequence(first=prompt, middle=[llm], last=parser)

# Both invoke the same way
result = chain.invoke({"input": "hello"})

# You can inspect the chain
print(chain.steps)  # [prompt, llm, parser]

# RunnableLambda — wrap any Python function as a Runnable
from langchain_core.runnables import RunnableLambda

def add_context(text: str) -> str:
    return f"Context: {text}\\n\\nPlease analyze this."

# Wrap it
add_context_runnable = RunnableLambda(add_context)

# Now use it in a chain
chain = add_context_runnable | llm | parser
result = chain.invoke("Some important text")

# Shorthand: @ works too (less common)
chain = (lambda x: {"input": x.upper()}) | prompt | llm | parser
# But RunnableLambda is more explicit and recommended` },
          { type: "callout", variant: "info", text: "Key insight: The | operator builds a computation graph, not an eager execution. chain = a | b | c doesn't run anything. chain.invoke(x) does. This means you can build chains at startup (expensive) and invoke them many times (cheap)." }
        ],
        assignments: [
          { id: "m3l1a1", title: "Build Your Own RunnableSequence", difficulty: "Advanced", type: "Build", time: "2 hours",
            description: "Build a minimal implementation of Runnable from scratch — without importing from LangChain. Your Runnable class needs: __init__(fn), invoke(input), __or__(other) that creates a SequenceRunnable. SequenceRunnable.invoke() runs each step passing output to next. Test: create 3 plain Python functions, wrap them as Runnables, chain with |, invoke. Verify it produces the same result as the equivalent built-in LangChain chain.",
            deliverable: "Minimal Runnable implementation + test proving equivalence to LangChain" },
          { id: "m3l1a2", title: "Chain Inspection Tool", difficulty: "Intermediate", type: "Build", time: "1 hour",
            description: "Write a chain_inspector.py that takes any LCEL chain and: (1) prints each step with its type, (2) shows the input type expected by each step, (3) shows the output type of each step. Test on at least 4 different chains of varying complexity. Bonus: add a dry_run() method that calls each step with mock data and shows intermediate outputs.",
            deliverable: "chain_inspector.py working on 4 different chains" }
        ]
      },
      {
        id: "m3l2", title: "RunnableParallel & RunnablePassthrough", readTime: "25 min",
        content: [
          { type: "text", text: "Parallel execution is one of LCEL's killer features. Instead of calling multiple chains sequentially, run them concurrently and collect results. This can dramatically reduce latency for pipelines that don't depend on each other's outputs." },
          { type: "code", lang: "python", code: `from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import time

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# RunnableParallel — run multiple chains in parallel, collect as dict
parallel_chain = RunnableParallel(
    summary=ChatPromptTemplate.from_messages([
        ("system", "Summarize in 1 sentence."),
        ("human", "{text}")
    ]) | llm | StrOutputParser(),
    
    sentiment=ChatPromptTemplate.from_messages([
        ("system", "Output ONLY: positive, negative, or neutral"),
        ("human", "{text}")
    ]) | llm | StrOutputParser(),
    
    keywords=ChatPromptTemplate.from_messages([
        ("system", "Output 5 keywords as comma-separated values, nothing else."),
        ("human", "{text}")
    ]) | llm | StrOutputParser()
)

text = "LangChain is an incredible framework for building AI applications..."

start = time.time()
result = parallel_chain.invoke({"text": text})
print(f"Parallel: {time.time()-start:.2f}s")
print(result)  # {"summary": ..., "sentiment": ..., "keywords": ...}

# RunnablePassthrough — pass input to output unchanged
# Critical for passing original data alongside transformed data
from langchain_core.runnables import RunnablePassthrough

rag_chain = RunnableParallel(
    context=RunnableLambda(lambda x: "Retrieved docs: " + x["query"]),
    question=RunnablePassthrough()  # Pass original question through unchanged
) | ChatPromptTemplate.from_messages([
    ("system", "Answer based on context: {context}"),
    ("human", "{question}")
]) | llm | StrOutputParser()` }
        ],
        assignments: [
          { id: "m3l2a1", title: "Parallel vs Sequential Benchmark", difficulty: "Intermediate", type: "Experiment", time: "2 hours",
            description: "Build two versions of a document analysis pipeline: (a) sequential: sentiment → summary → keywords → one line at a time, (b) parallel: all three at once with RunnableParallel. Run both on 5 different texts. Measure wall-clock time for each. Calculate speedup ratio (sequential_time / parallel_time). The ratio should approach the number of parallel branches for fast calls. Document any cases where parallel wasn't faster and explain why.",
            deliverable: "Both pipelines + timing comparison table + explanation of anomalies" },
          { id: "m3l2a2", title: "Multi-Source RAG Setup", difficulty: "Advanced", type: "Build", time: "3 hours",
            description: "Build a multi_source_rag.py that retrieves from 2 'sources' in parallel (use two hardcoded dicts as mock vector stores), combines the results, and feeds into a final LLM that synthesizes an answer. Use RunnableParallel for concurrent retrieval, RunnablePassthrough to preserve the original question, and a custom RunnableLambda to combine sources. The chain signature: user_question → {source_a_results, source_b_results, original_question} → answer.",
            deliverable: "Working multi-source RAG with parallel retrieval" }
        ]
      },
      {
        id: "m3l3", title: "Streaming with LCEL", readTime: "20 min",
        content: [
          { type: "text", text: "LCEL chains support streaming natively. When you call chain.stream(), tokens flow through each step of the chain as they're generated. This is essential for good UX in chat applications." },
          { type: "code", lang: "python", code: `from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

chain = (
    ChatPromptTemplate.from_messages([("human", "Tell me a story about {topic}")])
    | ChatOpenAI(model="gpt-4o-mini", streaming=True)
    | StrOutputParser()
)

# Stream the output
print("Streaming:")
for chunk in chain.stream({"topic": "a robot learning to paint"}):
    print(chunk, end="", flush=True)
print()  # newline at end

# Stream intermediate values (not just final output)
# Use .astream_events() for full event visibility
import asyncio

async def stream_with_events():
    async for event in chain.astream_events(
        {"topic": "a robot learning to paint"},
        version="v2"
    ):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            print(chunk.content, end="", flush=True)
        elif kind == "on_chain_start":
            print(f"\\n[CHAIN START: {event['name']}]")
        elif kind == "on_chain_end":
            print(f"\\n[CHAIN END: {event['name']}]")

asyncio.run(stream_with_events())` }
        ],
        assignments: [
          { id: "m3l3a1", title: "Streaming Chat Interface", difficulty: "Intermediate", type: "Build", time: "2 hours",
            description: "Build a streaming_chat.py that creates an interactive command-line chat interface. Requirements: (1) User types a message, response streams token-by-token to terminal, (2) Maintains conversation history across turns, (3) Shows a typing indicator '...' while waiting for first token, (4) Displays elapsed time after each response, (5) 'quit' exits. Stretch: add a --no-stream flag that shows full response at once for comparison.",
            deliverable: "Working streaming CLI chat with history" }
        ]
      },
      {
        id: "m3l4", title: "Building Complex Chains", readTime: "30 min",
        content: [
          { type: "text", text: "Real-world chains combine sequential steps, parallel branches, conditional logic, and error handling. Here's how to architect non-trivial pipelines." },
          { type: "code", lang: "python", code: `from langchain_core.runnables import RunnableLambda, RunnableParallel, RunnableBranch
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# RunnableBranch — conditional routing
def route(info: dict):
    topic = info.get("topic", "").lower()
    if "code" in topic or "python" in topic:
        return "code"
    elif "math" in topic:
        return "math"
    else:
        return "general"

code_chain = ChatPromptTemplate.from_messages([
    ("system", "You are an expert programmer. Show code examples."),
    ("human", "{question}")
]) | llm | StrOutputParser()

math_chain = ChatPromptTemplate.from_messages([
    ("system", "You are a math tutor. Show step-by-step working."),
    ("human", "{question}")
]) | llm | StrOutputParser()

general_chain = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{question}")
]) | llm | StrOutputParser()

# Branch routes to different chains based on input
branch = RunnableBranch(
    (lambda x: route(x) == "code", code_chain),
    (lambda x: route(x) == "math", math_chain),
    general_chain  # default
)

# Full pipeline with preprocessing
full_chain = (
    RunnablePassthrough.assign(
        topic=RunnableLambda(lambda x: x["question"])
    )
    | branch
)

result = full_chain.invoke({"question": "How do I write a Python decorator?"})
print(result)` },
          { type: "callout", variant: "tip", text: "Use RunnablePassthrough.assign() to add computed fields to a dict without losing existing fields. It's equivalent to: lambda x: {**x, 'new_key': compute(x)}" }
        ],
        assignments: [
          { id: "m3l4a1", title: "Intent Router", difficulty: "Advanced", type: "Build", time: "3 hours",
            description: "Build an intelligent_router.py that routes user queries to specialized chains based on detected intent. Use an LLM to classify intent (code help, writing help, data analysis, general). Each route has a specialized system prompt and potentially different model parameters. Build 4 route chains + 1 classification chain + 1 RunnableBranch. Test with 20 queries (5 per category). Measure: routing accuracy, and whether the specialized chains actually produce better outputs than a general chain.",
            deliverable: "Working router with 20 test cases and accuracy measurement" },
          { id: "m3l4a2", title: "Error-Resilient Chain", difficulty: "Advanced", type: "Build", time: "2 hours",
            description: "Build a resilient chain that: (1) tries primary LLM (GPT-4o-mini), (2) on timeout/error, falls back to a backup LLM (try Claude or Gemini), (3) if both fail, returns a structured error response. Use try/except within a RunnableLambda for the fallback logic. Test by temporarily using an invalid API key for the primary. The chain should never crash — always return a valid response object.",
            deliverable: "Resilient chain with demonstrated fallback behavior" }
        ]
      }
    ]
  },

  /* ── MODULE 4 ─────────────────────────────────────────────── */
  {
    id: "m4", num: "04", icon: "🧠", accent: "#34D399",
    title: "Memory & Conversation Management",
    tagline: "Stateless LLMs + your memory code = conversational AI",
    overview: "LLMs are stateless by default — every call is a blank slate. Memory is the code YOU write to maintain conversation state. You'll implement all four major memory strategies (buffer, window, summary, summary-buffer) using RunnableWithMessageHistory, and understand the token cost tradeoffs of each.",
    project: {
      title: "Conversational Memory Benchmark",
      time: "5-6 hours",
      description: "Build a memory_benchmark.py that tests all 4 memory types on the same conversation script (a 20-turn conversation you design, covering topics that test recall: names, preferences, facts stated early). For each memory type: run the full 20-turn script, record token usage per turn, record whether early facts are remembered at turn 20. Build a comparison dashboard as a simple printed table showing: memory type, avg tokens/turn, peak tokens, early recall accuracy, late recall accuracy.",
      skills: ["All 4 memory types", "RunnableWithMessageHistory", "Token counting", "Conversation design"]
    },
    lessons: [
      {
        id: "m4l1", title: "Why Memory Is Your Code, Not LangChain's", readTime: "20 min",
        content: [
          { type: "text", text: "LLMs are stateless. Every API call is independent — the model has no memory of previous calls. Conversational memory is an illusion you create by injecting prior conversation turns into every new prompt.\n\nThis is a crucial mental model shift: you're not giving the LLM memory. You're giving it a longer context window filled with history. The LLM thinks every call is its first." },
          { type: "code", lang: "python", code: `# How conversation memory actually works (no magic)
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Without memory — LLM forgets immediately
response1 = llm.invoke([HumanMessage(content="My name is Blake.")])
response2 = llm.invoke([HumanMessage(content="What is my name?")])
print(response2.content)  # "I don't know your name" — stateless!

# WITH manual memory — you manage the list yourself
history = []
def chat(user_message: str) -> str:
    history.append(HumanMessage(content=user_message))
    response = llm.invoke([
        SystemMessage(content="You are a helpful assistant."),
        *history  # Inject ALL history every time
    ])
    history.append(response)  # Save AI response to history
    return response.content

chat("My name is Blake.")
chat("I'm learning LangChain.")
response = chat("What is my name and what am I studying?")
print(response)  # "Your name is Blake and you're studying LangChain."

# That manual list IS the memory. LangChain's memory classes
# just manage that list for you with different strategies.` },
          { type: "callout", variant: "warning", text: "Every message in history costs tokens every call. A 20-turn conversation costs 20× more tokens at turn 20 than at turn 1 (buffer memory). This is why memory strategy matters — it's a direct cost and latency driver." }
        ],
        assignments: [
          { id: "m4l1a1", title: "Manual Memory Implementation", difficulty: "Intermediate", type: "Build", time: "1.5 hours",
            description: "Build a manual_chat.py WITHOUT using any LangChain memory classes. Implement: (1) a chat() function that takes user input and returns LLM response, (2) maintains a history list of messages, (3) injects history into every LLM call, (4) after each response, prints the token count of the full context being sent. Test with a 10-turn conversation. At turn 10, print the total context being sent and calculate its token cost at GPT-4o-mini pricing.",
            deliverable: "manual_chat.py with token tracking per turn" }
        ]
      },
      {
        id: "m4l2", title: "Buffer Memory with RunnableWithMessageHistory", readTime: "30 min",
        content: [
          { type: "text", text: "Buffer memory is the simplest strategy: store everything, inject everything. Use it when: conversations are expected to be short, you have a large context window and money to spend, or you absolutely cannot afford to lose any detail." },
          { type: "code", lang: "python", code: `from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# Build the chain first
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant named Aria."),
    MessagesPlaceholder(variable_name="history"),  # History injected here
    ("human", "{input}")
])

chain = prompt | llm

# Session store — maps session_id to history object
session_store = {}

def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
    if session_id not in session_store:
        session_store[session_id] = InMemoryChatMessageHistory()
    return session_store[session_id]

# Wrap chain with memory management
chain
