import requests
import time

# API URLs
ANALYZE_API_URL = "http://127.0.0.1:8000/analyze"
METRICS_API_URL = "http://127.0.0.1:8000/evaluate/metrics"

# 100 Indian Legal Queries with Ground Truth Domains
DATASET = [
    # Family Law
    {"text": "My husband is filing for divorce, how do I claim alimony?", "true_domain": "Family Law"},
    {"text": "What is the procedure for mutual consent divorce in India?", "true_domain": "Family Law"},
    {"text": "Can I claim child custody if I am a working mother?", "true_domain": "Family Law"},
    {"text": "How does domestic violence affect divorce proceedings?", "true_domain": "Family Law"},
    {"text": "My father died without a will, how will the property be divided among siblings?", "true_domain": "Family Law"},
    {"text": "What are the rules regarding the Muslim Women Protection of Rights on Marriage Act?", "true_domain": "Family Law"},
    {"text": "Is it possible to annul my marriage if my spouse hid their previous marriage?", "true_domain": "Family Law"},
    {"text": "How do I register my marriage under the Special Marriage Act?", "true_domain": "Family Law"},
    {"text": "My wife left the matrimonial home without reason. How can I invoke restitution of conjugal rights?", "true_domain": "Family Law"},
    {"text": "Can grandparents file for visitation rights of their grandchildren?", "true_domain": "Family Law"},
    {"text": "Are prenuptial agreements valid and enforceable in Indian courts?", "true_domain": "Family Law"},
    {"text": "What are the grounds for divorce under the Hindu Marriage Act 1955?", "true_domain": "Family Law"},
    {"text": "How do I legally adopt a child as a single woman in India?", "true_domain": "Family Law"},
    {"text": "Can I get maintenance from my son under the Senior Citizens Act?", "true_domain": "Family Law"},
    {"text": "What is the legal age of marriage for men and women currently?", "true_domain": "Family Law"},
    {"text": "How can I secure a restraining order against an abusive family member?", "true_domain": "Family Law"},

    # Employment Law
    {"text": "My employer fired me without a 30-day notice. Is this illegal?", "true_domain": "Employment Law"},
    {"text": "I was denied maternity leave by my HR. What can I do?", "true_domain": "Employment Law"},
    {"text": "How can I report sexual harassment at my workplace (POSH)?", "true_domain": "Employment Law"},
    {"text": "My company is not paying my full and final settlement after I resigned.", "true_domain": "Employment Law"},
    {"text": "Is it legal for my employer to hold my original educational certificates?", "true_domain": "Employment Law"},
    {"text": "Can my employer enforce a 2-year non-compete clause after I quit?", "true_domain": "Employment Law"},
    {"text": "I was injured on a construction site. Am I eligible for workmen's compensation?", "true_domain": "Employment Law"},
    {"text": "Does my company legally have to provide PF benefits if they have 50 employees?", "true_domain": "Employment Law"},
    {"text": "Can an employer deduct my salary for reporting late to work?", "true_domain": "Employment Law"},
    {"text": "What are the working hour limits under the Factories Act?", "true_domain": "Employment Law"},
    {"text": "Is gratuity mandatory if I have completed 5 years with a company?", "true_domain": "Employment Law"},
    {"text": "My boss keeps rejecting my sick leaves despite having medical certificates.", "true_domain": "Employment Law"},
    {"text": "Can an employer fire an employee for their political views outside of work?", "true_domain": "Employment Law"},
    {"text": "I am a contract worker. Do I have the same rights as permanent staff?", "true_domain": "Employment Law"},
    {"text": "What is the procedure for forming an employee trade union?", "true_domain": "Employment Law"}, #15
    {"text": "My employer gave a bad reference out of revenge, costing me a new job.", "true_domain": "Employment Law"},

    # Rental & Property Law
    {"text": "My landlord is forcing me out before the lease ends. Can he do that?", "true_domain": "Rental Law"},
    {"text": "How much security deposit can a landlord legally demand in Bangalore?", "true_domain": "Rental Law"},
    {"text": "The tenant refuses to pay rent for 4 months. How can I evict him?", "true_domain": "Rental Law"},
    {"text": "My tenant has sublet my apartment without my permission. What should I do?", "true_domain": "Rental Law"},
    {"text": "Is the 11-month rent agreement legally binding if not registered?", "true_domain": "Rental Law"},
    {"text": "My landlord refuses to return my deposit even though there is no damage.", "true_domain": "Rental Law"},
    {"text": "Can a landlord arbitrarily increase the rent by 30% in a single year?", "true_domain": "Rental Law"},
    {"text": "What rights do I have under the Rent Control Act?", "true_domain": "Rental Law"},
    {"text": "How do I transfer property ownership from my father to myself via a gift deed?", "true_domain": "Property Law"},
    {"text": "What is the difference between a sale deed and an agreement to sell?", "true_domain": "Property Law"},
    {"text": "My neighbor is constructing a wall that blocks my sunlight. Is this an easement issue?", "true_domain": "Property Law"},
    {"text": "How do I verify the ancestral property title before purchasing agriculture land?", "true_domain": "Property Law"},
    {"text": "Can I claim adverse possession if I have lived on vacant land for 15 years?", "true_domain": "Property Law"},
    {"text": "What are the RERA regulations regarding delayed possession by a builder?", "true_domain": "Property Law"},
    {"text": "Can NRIs buy agricultural land in India legally?", "true_domain": "Property Law"},
    {"text": "What is mutation of property, and why is it necessary after purchase?", "true_domain": "Property Law"},

    # Criminal Law
    {"text": "What is the procedure to file an FIR at the local police station?", "true_domain": "Criminal Law"},
    {"text": "The police refused to register my FIR. What should my next step be?", "true_domain": "Criminal Law"},
    {"text": "What constitutes culpable homicide vs murder under IPC 302?", "true_domain": "Criminal Law"},
    {"text": "How can I apply for anticipatory bail if I suspect I will be falsely accused?", "true_domain": "Criminal Law"},
    {"text": "What are my rights if the police arrest me without a warrant?", "true_domain": "Criminal Law"},
    {"text": "Is drinking and driving a non-bailable offense in India?", "true_domain": "Criminal Law"},
    {"text": "How do I respond to a defamation notice filed against me on Twitter?", "true_domain": "Criminal Law"},
    {"text": "Someone is blackmailing me with morphed photos online. Where do I report this?", "true_domain": "Criminal Law"},
    {"text": "What is the difference between Section 144 and a curfew?", "true_domain": "Criminal Law"},
    {"text": "How long can police keep a suspect in police remand before transferring to judicial custody?", "true_domain": "Criminal Law"},
    {"text": "Can a bounced cheque case under Section 138 lead to jail time?", "true_domain": "Criminal Law"},
    {"text": "What are the provisions for self-defense under the Indian Penal Code?", "true_domain": "Criminal Law"},
    {"text": "Is call recording without consent illegal in India?", "true_domain": "Criminal Law"},
    {"text": "How do I quash a false FIR filed against my family under Section 498A?", "true_domain": "Criminal Law"},
    {"text": "What is a zero FIR and when is it applicable?", "true_domain": "Criminal Law"},
    {"text": "Under what conditions can the police tap my phone legally?", "true_domain": "Criminal Law"},
    {"text": "Is participating in a peaceful protest a criminal offense?", "true_domain": "Criminal Law"},

    # Consumer Protection & Corporate Law
    {"text": "I ordered an iPhone from a website, but they sent a brick. How do I sue them?", "true_domain": "Consumer Protection"},
    {"text": "A hospital gave me the wrong medication which worsened my illness. Is this medical negligence?", "true_domain": "Consumer Protection"},
    {"text": "My insurance company rejected my health claim citing pre-existing diseases falsely.", "true_domain": "Consumer Protection"},
    {"text": "The airline lost my luggage and refuses to compensate me properly.", "true_domain": "Consumer Protection"},
    {"text": "A restaurant charged a service fee that I did not agree to pay.", "true_domain": "Consumer Protection"},
    {"text": "The coaching center refuses to refund my fees after I quit one week in.", "true_domain": "Consumer Protection"},
    {"text": "I bought a defective car, and the dealer won't honor the warranty.", "true_domain": "Consumer Protection"},
    {"text": "How do I file a complaint in the District Consumer Disputes Redressal Forum?", "true_domain": "Consumer Protection"},
    {"text": "Is misleading advertisement legally punishable in India?", "true_domain": "Consumer Protection"},
    {"text": "A food delivery app charged me for an item but didn't deliver it. the support isn't helping.", "true_domain": "Consumer Protection"},
    {"text": "What is the liability of an e-commerce platform for third-party sellers?", "true_domain": "Consumer Protection"},
    {"text": "What are the legal steps to register a Private Limited Company?", "true_domain": "Corporate Law"},
    {"text": "How do I register a trademark for my new startup logo?", "true_domain": "Corporate Law"},
    {"text": "What happens if a company cannot pay its debts? Can it declare bankruptcy?", "true_domain": "Corporate Law"},
    {"text": "Can a minority shareholder file a case against the directors for oppression?", "true_domain": "Corporate Law"},
    {"text": "How can two companies legally merge in India?", "true_domain": "Corporate Law"},
    {"text": "What are the CSR (Corporate Social Responsibility) requirements for companies?", "true_domain": "Corporate Law"},
    {"text": "Can foreign nationals start a company in India as a 100% owner?", "true_domain": "Corporate Law"},
    {"text": "Are non-disclosure agreements (NDAs) legally enforceable in India?", "true_domain": "Corporate Law"},
    
    # General Law (Remaining 16 to hit ~100 exactly)
    {"text": "How do I file an RTI to get information about road tender spending?", "true_domain": "General Law"},
    {"text": "Can the government acquire my private land without my consent for a highway?", "true_domain": "General Law"},
    {"text": "Are online rummy and poker legally considered games of skill or gambling?", "true_domain": "General Law"},
    {"text": "What are the rules regarding keeping exotic pets in India?", "true_domain": "General Law"},
    {"text": "Is it legal to use a drone for wedding photography without a license?", "true_domain": "General Law"},
    {"text": "How do I get my name officially changed in the government gazette?", "true_domain": "General Law"},
    {"text": "Are cryptocurrencies strictly banned or just unregulated in India today?", "true_domain": "General Law"},
    {"text": "What is the punishment for violating copyright law on YouTube?", "true_domain": "General Law"},
    {"text": "Can I sue a municipality if I break my leg by falling into an open manhole?", "true_domain": "General Law"},
    {"text": "Do I have to pay income tax on gifts received from my employer?", "true_domain": "General Law"},
    {"text": "Can I be forced to link my Aadhaar card to my bank account?", "true_domain": "General Law"},
    {"text": "Is prostitution legal in India, and what are the related laws?", "true_domain": "General Law"},
    {"text": "How do I apply for a duplicate voter ID if I lost mine?", "true_domain": "General Law"},
    {"text": "Are dash cams legal to use in private vehicles in India?", "true_domain": "General Law"},
    {"text": "Is it completely legal to install CCTV cameras observing the street from my house?", "true_domain": "General Law"},
    {"text": "Can a school legally withhold the transfer certificate of a child for non-payment of fees?", "true_domain": "General Law"}
]


def run_evaluation():
    print(f"🚀 Starting Evaluation on {len(DATASET)} Legal Queries...")
    
    y_true = []
    y_pred = []
    failed = 0
    
    for i, item in enumerate(DATASET):
        queryText = item["text"]
        trueDomain = item["true_domain"]
        
        y_true.append(trueDomain)
        
        # 1. Ask the AI Model
        payload = {"user_query": queryText, "selected_language": "english"}
        try:
            res = requests.post(ANALYZE_API_URL, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                
                # We expect the model to return a classified domain 
                # (You may need to adapt "domain" to whatever exact key your orchestrator uses)
                predicted_domain = data.get("domain", "General Law")
                y_pred.append(predicted_domain)
                print(f"[{i+1}/{len(DATASET)}] True: {trueDomain:20} -> Pred: {predicted_domain}")
            else:
                print(f"[{i+1}/{len(DATASET)}] API Error: {res.status_code}")
                y_pred.append("Error")
                failed += 1
        except Exception as e:
            print(f"[{i+1}/{len(DATASET)}] Request Failed: {e}")
            y_pred.append("Error")
            failed += 1
            
        # ⚠️ Delay to avoid hitting Gemini Free Tier Limit (15 Requests Per Minute)
        time.sleep(4)

    print(f"\n📊 Evaluation complete. ({failed} failed requests)")
    
    # 2. Call the Metrics Endpoint
    try:
        metrics_payload = {
            "y_true": y_true,
            "y_pred": y_pred
        }
        res_metrics = requests.post(METRICS_API_URL, json=metrics_payload)
        
        if res_metrics.status_code == 200:
            print("\n✅ Final Model Performance Metrics:")
            print(json.dumps(res_metrics.json(), indent=4))
        else:
            print(f"Failed to calculate metrics. Error {res_metrics.status_code}")
            
    except Exception as e:
        print("Failed to contact metrics endpoint:", e)


if __name__ == "__main__":
    run_evaluation()
