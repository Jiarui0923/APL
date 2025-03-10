import json

analytics_agreement_template = {
    "enable": False,
    "host": "https://jellyroll.cs.tulane.edu/jstat/stat/",
    "timeout": 1,
    "record_host": False,
    "record_parameter": False,
    "record_signature": True
}
agreement_template = """

---------------------------------------------
          Analytics Agreement
---------------------------------------------
Would you allow us to collect your information
for algorithm access statiticals only for
scientific research purpose?
The information we would collect including:
  - Algorithm Access
  - Algorithm Calling Signature
  - Computer Identifier
  - Parameter Combination
These information will be sent to our sever.
"""
agreement_end = """
---------------------------------------------

"""
choose_info = """
Please input Y/N for agree/reject. (Default: Y)
[ Y (agree) / N (reject) ]:
"""
def analytics_agreement(path='janalytics.json'):
    print(agreement_template)
    if input(choose_info).upper() not in ['Y', 'YES', '', '\n']:
        print("Analytics denied. \nWe will NOT collect any data.")
        print(agreement_end)
        return analytics_agreement_template
    analytics_agreement_template['enable'] = True
    # print("Would you like to share your\ncomputer identifier?")
    # if input(choose_info).upper() not in ['Y', 'YES', '', '\n']:
    #     analytics_agreement_template['record_host'] = False
    # else: analytics_agreement_template['record_host'] = True
    analytics_agreement_template['record_host'] = True
    # print("Would you like to share your\nalgorithm paramters combination?")
    # if input(choose_info).upper() not in ['Y', 'YES', '', '\n']:
    #     analytics_agreement_template['record_parameter'] = False
    # else: analytics_agreement_template['record_parameter'] = True
    analytics_agreement_template['record_parameter'] = True
    with open(path, 'w') as conf_f_:
        json.dump(analytics_agreement_template, conf_f_)
    print("Thank you for allow us to analyze.")
    # print("Thank you for allow us to analyze.\nWe will collect:")
    # print(" - Algorithm Access")
    # print(" - Algorithm Calling Signature")
    # if analytics_agreement_template['record_host']:
    #     print(" - Host Identifier")
    # if analytics_agreement_template['record_parameter']:
    #     print(" - Algorithm Paramters")
    print(agreement_end)
    return analytics_agreement_template