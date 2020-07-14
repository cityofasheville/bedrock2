from cement import Controller, ex
import os

from ..src.preprocess_assets.preprocess_assets import preprocess_assets_in_s3

class BedrockCore(Controller):
    class Meta:
        label = 'core'
        stacked_type = 'embedded'
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
        if self.app.pargs.output is not None:
            output_mode = self.app.pargs.output
        val = preprocess_assets_in_s3(BUCKETNAME, output_mode)
        print(val)
        pass
