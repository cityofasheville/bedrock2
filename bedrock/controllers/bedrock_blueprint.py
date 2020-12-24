from cement import Controller, ex
import os

from ..src.preprocess_assets.preprocess_assets import preprocess_assets_in_s3

class BedrockBlueprint(Controller):
    class Meta:
        label = 'blueprint'
        stacked_type = 'nested'
        stacked_on = 'base'
    
    @ex(
        help='preprocess assets',

        arguments=[
            ### preprocess assets command help
            ( [ '-o', '--output' ],
              { 'help' : 'output mode: s3 (default) or stdout' } ),
        ],
    )
    def preprocess(self):
        BUCKETNAME = os.getenv('bedrock_bucketname')
        output_mode = 's3'
        val = BUCKETNAME
        print(val)
        pass
