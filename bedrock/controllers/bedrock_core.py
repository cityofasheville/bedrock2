from cement import Controller, ex

from ..src.preprocess_assets.preprocess_assets import preprocess_assets_in_s3

class BedrockCore(Controller):
    class Meta:
        label = 'core'
        stacked_type = 'embedded'
        stacked_on = 'base'
    
    @ex(help='preprocess assets')
    def preprocess(self):
        val = preprocess_assets_in_s3('Hi there!')
        print(val)
        pass
