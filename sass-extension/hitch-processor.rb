require 'sass'
require 'optparse'
require 'json'

class HitchProcessor

	def initialize(filename)
		@filename = filename
	end

	def process
		engine = Sass::Engine.for_file(@filename, {:syntax => :scss})
		tree = engine.to_tree
    tree.each do |node|
      if node.is_a? Sass::Tree::RuleNode
        node.parsed_rules.members.each do |selector|
          selector.members.each do |sequence|
            sequence.members.collect! do |seq|
              if seq.is_a? Sass::Selector::Pseudo
                # this is what JS does
                # return "_" + s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);              
                # this is what Ruby _would_ do to match JS (this however is wrong right now).
                hitch_hash = seq.name[0].hash
                Sass::Selector::Class.new(hitch_hash) 
              else
                seq
              end
            end
            puts sequence.members
          end
        end
      else
        puts node.class
      end
    end
    return tree
	end

end

options = {}

parser = OptionParser.new do |opts|
	opts.banner = "Usage: hitch-processor sass_file hitched_file"
end

options = parser.parse(ARGV)
sass_file, hitched_file = ARGV

hitched = HitchProcessor.new(sass_file).process 
File.open(hitched_file, "w") do |f| 
	f.puts hitched.render
end
